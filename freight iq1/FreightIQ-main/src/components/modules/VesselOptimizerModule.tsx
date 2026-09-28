import { useEffect, useState } from "react";
import { type Port, type CargoInput } from "../../services/api";
import { getVesselsAtPort, type VesselAtPort } from "../../services/csvData";
import { DataSourceBanner } from "./FreightForecastModule";

interface Props {
  port: Port;
  cargo: CargoInput;
}

const VESSEL_SPECS: Record<string, { draft: number; loa: number }> = {
  Capesize: { draft: 18.0, loa: 290 },
  Panamax: { draft: 13.8, loa: 225 },
  Supramax: { draft: 12.5, loa: 196 },
  Handymax: { draft: 11.5, loa: 183 },
  Handysize: { draft: 10.0, loa: 170 },
};

function getStatusRank(status: string): number {
  if (status === "Working") return 1;
  if (status === "Waiting") return 2;
  if (status === "Waiting & Expected") return 3;
  if (status === "Expected") return 4;
  return 5;
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "Working":
      return { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" };
    case "Waiting":
      return { background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" };
    case "Waiting & Expected":
      return { background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" };
    case "Expected":
      return { background: "rgba(14,202,212,0.12)", color: "#0ecad4", border: "1px solid rgba(14,202,212,0.25)" };
    default:
      return { background: "rgba(90,125,150,0.12)", color: "#94b8d0", border: "1px solid rgba(90,125,150,0.25)" };
  }
}

export default function VesselOptimizerModule({ port, cargo }: Props) {
  const [vessels, setVessels] = useState<VesselAtPort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVesselsAtPort(port.id)
      .then((vList) => {
        setVessels(vList);
        setLoading(false);
      })
      .catch(() => {
        setVessels([]);
        setLoading(false);
      });
  }, [port.id]);

  if (loading) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.08)" }} />;
  }

  const spec = VESSEL_SPECS[cargo.vesselPreference] || { draft: 12.5, loa: 196 };
  const draftConstraintMet = spec.draft <= port.maxDraft;
  const loaConstraintMet = spec.loa <= port.maxLOA;

  const sortedVessels = [...vessels].sort((a, b) => {
    const rankDiff = getStatusRank(a.status) - getStatusRank(b.status);
    if (rankDiff !== 0) return rankDiff;
    return a.vesselName.localeCompare(b.vesselName);
  });

  return (
    <div className="space-y-6">
      <DataSourceBanner text="Vessels shown are those currently at, waiting at, or expected at this port per uploaded vessel data — not a chartering-market recommendation. No live fixture/rate feed is connected." />

      {/* Suitability / Constraint cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SuitCard label="Draft Constraint" value={draftConstraintMet ? "✓ Compliant" : "✗ Exceeds limit"} ok={draftConstraintMet} />
        <SuitCard label="LOA Constraint" value={loaConstraintMet ? "✓ Compliant" : "✗ Too large"} ok={loaConstraintMet} />
      </div>

      {/* Real Vessel Data Table */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="font-bold text-base" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Current Vessels at Port ({sortedVessels.length})
          </h3>
        </div>

        {sortedVessels.length === 0 ? (
          <div className="p-8 text-center rounded-xl card-glass">
            <p className="text-sm font-medium" style={{ color: "#5a7d96" }}>
              No vessel activity currently recorded at this port
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl card-glass p-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(14,202,212,0.12)", color: "#5a7d96" }}>
                  <th className="p-3 font-semibold mono">Vessel Name</th>
                  <th className="p-3 font-semibold mono">Status</th>
                  <th className="p-3 font-semibold mono">Cargo</th>
                  <th className="p-3 font-semibold mono text-right">Quantity (MT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {sortedVessels.map((v, i) => (
                  <tr key={`${v.vesselName}-${i}`} className="hover:bg-cyan-500/5 transition-colors" style={{ color: "#e8f1f8" }}>
                    <td className="p-3 font-medium" style={{ fontFamily: "Outfit, sans-serif" }}>{v.vesselName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={getStatusBadgeStyle(v.status)}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-3" style={{ color: "#94b8d0" }}>{v.cargo}</td>
                    <td className="p-3 text-right mono font-medium">
                      {v.quantityMts !== null && v.quantityMts !== undefined && v.quantityMts > 0
                        ? `${v.quantityMts.toLocaleString()} MT`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Port constraints */}
      <div className="p-5 rounded-xl card-glass">
        <h3 className="font-bold mb-3" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Port Constraints — {port.name}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { label: "Max Draft", value: `${port.maxDraft}m`, ok: true },
            { label: "Max LOA", value: `${port.maxLOA}m`, ok: true },
            { label: "Berths", value: `${port.berths} total`, ok: true },
            { label: "Status", value: port.status, ok: port.status === "operational" },
          ].map((c) => (
            <div key={c.label} className="p-3 rounded-lg" style={{ background: "rgba(14,202,212,0.04)" }}>
              <div className="mono mb-1" style={{ color: "#5a7d96" }}>{c.label}</div>
              <div className="font-semibold" style={{ color: c.ok ? "#10b981" : "#f59e0b" }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuitCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="p-4 rounded-xl card-glass text-center">
      <div className="text-xs mb-2" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>{label}</div>
      <div className="font-bold text-sm" style={{ color: ok ? "#10b981" : "#ef4444", fontFamily: "Outfit, sans-serif" }}>{value}</div>
    </div>
  );
}
