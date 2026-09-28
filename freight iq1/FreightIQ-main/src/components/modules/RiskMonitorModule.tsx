import { useEffect, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { fetchRiskData, type Port, type CargoInput, type RiskData } from "../../services/api";
import { DataSourceBanner } from "./FreightForecastModule";

interface Props { port: Port; cargo: CargoInput; }

export default function RiskMonitorModule({ port }: Props) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchRiskData(port).then((d) => { setData(d); setLoading(false); });
  }, [port.id]);

  if (loading) return <div className="h-64 rounded-xl animate-pulse" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.08)" }} />;
  if (!data) return null;

  const riskColor = (score: number) => score >= 70 ? "#ef4444" : score >= 50 ? "#f59e0b" : "#10b981";
  const overallColor = riskColor(data.overall);

  const radarData = data.categories.map((c) => ({ subject: c.label.split(" ")[0], value: c.score }));

  return (
    <div className="space-y-6">
      <DataSourceBanner text={`All categories below are computed from real vessel and berth data as of ${data.dataAsOf}. Market Risk (rate volatility) is intentionally omitted — no external freight-rate feed is connected.`} />

      {/* Overall risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 p-6 rounded-xl card-glass flex flex-col items-center justify-center">
          <div className="text-xs mono mb-4" style={{ color: "#5a7d96" }}>OVERALL RISK SCORE</div>
          <RiskGauge value={data.overall} color={overallColor} />
          <div className="text-4xl font-black mt-3" style={{ color: overallColor, fontFamily: "Outfit, sans-serif" }}>{data.overall}</div>
          <div className="text-sm mt-1" style={{ color: overallColor }}>{data.overall >= 70 ? "HIGH RISK" : data.overall >= 50 ? "MODERATE" : "LOW RISK"}</div>
        </div>

        {/* Radar */}
        <div className="md:col-span-2 p-6 rounded-xl card-glass">
          <h3 className="font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Risk Profile Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(14,202,212,0.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#5a7d96", fontSize: 11, fontFamily: "Inter, sans-serif" }} />
              <Radar name="Risk Score" dataKey="value" stroke="#0ecad4" fill="#0ecad4" fillOpacity={0.12} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Risk unavailable card */}
      <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(90,125,150,0.06)", border: "1px dashed rgba(90,125,150,0.3)" }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#5a7d96" }} />
        <span className="text-sm" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>
          <strong style={{ color: "#e8f1f8" }}>Market Risk:</strong> Data unavailable — no external freight-rate index (BDI/C5TC/P5TC) feed is connected to this app.
        </span>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Active Alerts</h3>
          {data.alerts.map((alert, i) => {
            const colors = { high: "#ef4444", medium: "#f59e0b", low: "#5a7d96" };
            const bgs = { high: "rgba(239,68,68,0.06)", medium: "rgba(245,158,11,0.06)", low: "rgba(90,125,150,0.06)" };
            return (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: bgs[alert.severity], border: `1px solid ${colors[alert.severity]}30` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[alert.severity] }} />
                <span className="text-xs mono flex-shrink-0 uppercase" style={{ color: colors[alert.severity] }}>{alert.severity}</span>
                <span className="text-sm" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>{alert.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.categories.map((cat) => {
          const color = riskColor(cat.score);
          return (
            <div key={cat.label} className="p-5 rounded-xl card-glass">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm" style={{ color: "#e8f1f8", fontFamily: "Outfit, sans-serif" }}>{cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: cat.trend === "up" ? "#ef4444" : cat.trend === "down" ? "#10b981" : "#5a7d96" }}>
                    {cat.trend === "up" ? "▲" : cat.trend === "down" ? "▼" : "→"} {cat.trend}
                  </span>
                  <span className="font-bold" style={{ color, fontFamily: "Outfit, sans-serif" }}>{cat.score}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full mb-3" style={{ background: "rgba(14,202,212,0.08)" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${cat.score}%`, background: color }} />
              </div>
              <ul className="space-y-1">
                {cat.factors.map((f) => (
                  <li key={f} className="text-xs flex items-center gap-2" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#3a5c74" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskGauge({ value, color }: { value: number; color: string }) {
  const r = 42;
  const circ = Math.PI * r; // semi-circle
  const dash = (value / 100) * circ;
  return (
    <svg width="110" height="60" viewBox="0 0 110 60">
      <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="rgba(14,202,212,0.08)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} />
    </svg>
  );
}
