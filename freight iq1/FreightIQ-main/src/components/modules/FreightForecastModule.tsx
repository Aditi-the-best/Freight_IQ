import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { fetchFreightForecast, type Port, type CargoInput, type CongestionForecastData } from "../../services/api";

interface Props { port: Port; cargo: CargoInput; }

export default function FreightForecastModule({ port }: Props) {
  const [data, setData] = useState<CongestionForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFreightForecast(port).then((d) => { setData(d); setLoading(false); });
  }, [port.id]);

  if (loading) return <Skeleton />;
  if (!data) return null;

  const chartData = [
    ...data.historical.map((h) => ({ label: h.label, actual: h.index })),
    ...data.projected.map((p) => ({ label: p.label, projected: p.index })),
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-4 py-3 rounded-xl" style={{ background: "#0e1e30", border: "1px solid rgba(14,202,212,0.2)", fontFamily: "Inter, sans-serif" }}>
        <div className="text-xs mb-2" style={{ color: "#5a7d96" }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: "#94b8d0" }}>{p.name}:</span>
            <span className="font-mono font-medium" style={{ color: "#e8f1f8" }}>{Number(p.value)}/100</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <DataSourceBanner text={`Real data from vessel_snapshots.csv + berth_operations.csv, as of ${data.dataAsOf}. Directional congestion signal — not a freight rate.`} />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Congestion Index" value={`${data.currentIndex}/100`} sub={`As of ${data.dataAsOf}`} />
        <KpiCard label="7-Day Change" value={`${data.change7d >= 0 ? "+" : ""}${data.change7d} pts`} sub="vs. a week ago" color={data.change7d > 5 ? "#ef4444" : data.change7d < -5 ? "#10b981" : "#e8f1f8"} />
        <KpiCard label="Vessels Waiting" value={`${data.vesselsWaiting}`} sub="currently in queue" color="#f59e0b" />
        <KpiCard label="Volatility" value={`${data.volatility}`} sub="pts, day-to-day stdev" color="#f59e0b" />
      </div>

      {/* Chart */}
      <div className="rounded-xl card-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Congestion Pressure Index — 10 to 31 Aug
          </h3>
          <span className="text-xs mono px-3 py-1 rounded" style={{ background: "rgba(14,202,212,0.08)", color: "#5a7d96" }}>
            Real data · {port.name}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ecad4" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0ecad4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94b8d0" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#94b8d0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,202,212,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#5a7d96", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#5a7d96", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={data.historical[data.historical.length - 1]?.label} stroke="rgba(14,202,212,0.4)" strokeDasharray="4 4" label={{ value: "Latest data", fill: "#0ecad4", fontSize: 10 }} />
            <Area type="monotone" dataKey="actual" name="Congestion Index (real)" stroke="#0ecad4" strokeWidth={2} fill="url(#gradActual)" dot={{ fill: "#0ecad4", r: 3 }} connectNulls />
            <Area type="monotone" dataKey="projected" name="Trend projection" stroke="#94b8d0" strokeWidth={2} strokeDasharray="6 3" fill="url(#gradPredicted)" dot={{ fill: "#94b8d0", r: 3 }} connectNulls />
            <Legend wrapperStyle={{ fontSize: 11, color: "#5a7d96", fontFamily: "Inter, sans-serif" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Outlook */}
      <div className="p-5 rounded-xl card-glass">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#0ecad4" }} />
          <span className="text-xs font-semibold" style={{ color: "#0ecad4", fontFamily: "Outfit, sans-serif" }}>PORT PRESSURE OUTLOOK</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>{data.outlook}</p>
      </div>
    </div>
  );
}

export function DataSourceBanner({ text }: { text: string }) {
  return (
    <div className="px-4 py-2.5 rounded-lg flex items-start gap-2" style={{ background: "rgba(14,202,212,0.05)", border: "1px solid rgba(14,202,212,0.15)" }}>
      <span className="text-xs mt-0.5" style={{ color: "#0ecad4" }}>ⓘ</span>
      <span className="text-xs" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>{text}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, color = "#e8f1f8" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="p-4 rounded-xl card-glass">
      <div className="text-xs mb-2" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>{label}</div>
      <div className="text-xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color }}>{value}</div>
      <div className="text-xs" style={{ color: "#3a5c74", fontFamily: "JetBrains Mono, monospace" }}>{sub}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="h-24 rounded-xl" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.08)" }} />)}
      </div>
      <div className="h-80 rounded-xl" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.08)" }} />
    </div>
  );
}
