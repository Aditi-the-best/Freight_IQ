import { useEffect, useState } from "react";
import { fetchIdleAnalysis, type Port, type CargoInput, type IdleScenarioData } from "../../services/api";
import { DataSourceBanner } from "./FreightForecastModule";

interface Props { port: Port; cargo: CargoInput; }

const DEFAULT_ASSUMED_RATE = 18000;

export default function IdleAnalysisModule({ port }: Props) {
  const [data, setData] = useState<IdleScenarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(DEFAULT_ASSUMED_RATE);

  useEffect(() => {
    setLoading(true);
    fetchIdleAnalysis(port, rate).then((d) => { setData(d); setLoading(false); });
  }, [port.id, rate]);

  if (loading && !data) return <div className="h-64 rounded-xl animate-pulse" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.08)" }} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <DataSourceBanner text="No live vessel-hire rate feed is connected — idle cost math (rate × days) is real arithmetic, but the daily rate below is an assumption you control. Queue context is real, from vessel_snapshots.csv." />

      {/* Assumed rate input */}
      <div className="p-4 rounded-xl card-glass flex items-center gap-4 flex-wrap">
        <label className="text-xs font-medium" style={{ color: "#5a7d96" }}>Assumed Daily Vessel Hire Rate (USD)</label>
        <input
          type="number"
          value={rate}
          min={0}
          step={500}
          onChange={(e) => setRate(Number(e.target.value) || 0)}
          className="px-3 py-2 rounded-lg text-sm outline-none w-40"
          style={{ background: "rgba(14,202,212,0.06)", border: "1px solid rgba(14,202,212,0.2)", color: "#e8f1f8" }}
        />
        <span className="text-xs" style={{ color: "#3a5c74" }}>Editable assumption — not fetched from a rate feed</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl card-glass">
          <div className="text-xs mb-2" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Assumed Daily Idle Cost</div>
          <div className="text-2xl font-bold" style={{ color: "#e8f1f8", fontFamily: "Outfit, sans-serif" }}>${data.assumedDailyRate.toLocaleString()}</div>
          <div className="text-xs mt-1" style={{ color: "#5a7d96" }}>USD/day, user-set</div>
        </div>
        <div className="p-4 rounded-xl card-glass">
          <div className="text-xs mb-2" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Vessels Waiting Ahead</div>
          <div className="text-2xl font-bold" style={{ color: "#f59e0b", fontFamily: "Outfit, sans-serif" }}>{data.vesselsWaitingAhead}</div>
          <div className="text-xs mt-1" style={{ color: "#5a7d96" }}>real queue count, {data.dataAsOf}</div>
        </div>
        <div className="p-4 rounded-xl card-glass col-span-2 md:col-span-1">
          <div className="text-xs mb-2" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Queue Pressure</div>
          <div className="text-base font-bold" style={{ color: data.vesselsWaitingAhead === 0 ? "#10b981" : data.vesselsWaitingAhead <= 2 ? "#f59e0b" : "#ef4444", fontFamily: "Outfit, sans-serif" }}>
            {data.vesselsWaitingAhead === 0 ? "Low" : data.vesselsWaitingAhead <= 2 ? "Moderate" : "High"}
          </div>
          <div className="text-xs mt-1" style={{ color: "#5a7d96" }}>based on real queue length</div>
        </div>
      </div>

      {/* Scenario breakdown */}
      <div className="space-y-3">
        {data.scenarios
          .filter((s) => s.days === 7)
          .map((s, i) => {
            const severity = i === 0 ? "low" : i === 1 ? "medium" : "high";
            const colors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
            return (
              <div key={s.days} className="p-5 rounded-xl card-glass" style={{ borderLeft: `3px solid ${colors[severity]}` }}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold" style={{ color: "#e8f1f8", fontFamily: "Outfit, sans-serif" }}>{s.days}-Day Idle Scenario</span>
                  </div>
                  <p className="text-sm" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>{s.recommendation}</p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
