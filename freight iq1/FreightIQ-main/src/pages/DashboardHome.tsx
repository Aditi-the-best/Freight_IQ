import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { EAST_COAST_PORTS, type Port, type CargoInput } from "../services/api";
import { getLiveTickerStats, getPortActivityForAppPort, type LiveTickerStats, type PortActivitySummary } from "../services/csvData";
import { saveAnalysisSubmission, isSupabaseConfigured } from "../services/supabase";
import EastCoastMap from "../components/EastCoastMap";
import { useAuth } from "../context/AuthContext";

const CARGO_TYPES = ["Iron Ore", "Coal", "Bauxite", "Limestone", "Fertilizer", "POL", "Cement", "Steel Coils", "Grain", "General Cargo"];
const VESSEL_PREFS = ["Capesize", "Panamax", "Supramax", "Handymax", "Handysize", "Any"];
const DURATIONS = ["Spot (1 voyage)", "Short (1-3 months)", "Medium (3-6 months)", "Long (6-12 months)"];

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedPort, setSelectedPort] = useState<Port | null>(EAST_COAST_PORTS.find((p) => p.id === "paradip") || null);
  const [form, setForm] = useState<CargoInput>({
    cargoType: "Iron Ore",
    quantity: 50000,
    origin: "Paradip",
    destination: "Vizag, India",
    vesselPreference: "Supramax",
    contractDuration: "Spot (1 voyage)",
    laycanDate: "2025-09-18",
    constraints: "",
  });
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [stats, setStats] = useState<LiveTickerStats | null>(null);
  const [activity, setActivity] = useState<(PortActivitySummary & { displayName: string })[]>([]);

  useEffect(() => {
    getLiveTickerStats().then(setStats).catch(() => setStats(null));
    // Scoped to this app's 7 modeled ports (not all 14 ports present in the raw CSVs).
    Promise.all(EAST_COAST_PORTS.map(async (p) => ({ ...(await getPortActivityForAppPort(p.id)), displayName: p.name })))
      .then((rows) => setActivity(rows.sort((a, b) => b.totalVessels - a.totalVessels)))
      .catch(() => setActivity([]));
  }, []);

  // Deep-link support: Market Entry's "BOOK NOW" navigates to /dashboard#voyage-requirements.
  useEffect(() => {
    if (location.hash === "#voyage-requirements" && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      formRef.current.style.boxShadow = "0 0 0 2px rgba(14,202,212,0.5)";
      setTimeout(() => { if (formRef.current) formRef.current.style.boxShadow = ""; }, 1600);
    }
  }, [location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitState("saving");
    const { ok, error } = await saveAnalysisSubmission({
      submitted_by: user?.name ?? "Unknown",
      company: user?.company ?? "—",
      cargo_type: form.cargoType,
      quantity: form.quantity,
      origin: form.origin,
      destination: form.destination,
      vessel_preference: form.vesselPreference,
      contract_duration: form.contractDuration,
      laycan_date: form.laycanDate,
      constraints: form.constraints || null,
    });
    if (ok) { setSubmitState("saved"); setSubmitError(undefined); }
    else { setSubmitState("error"); setSubmitError(error); }
  };

  const handleViewIntelligence = (port: Port) => {
    sessionStorage.setItem("freightiq_port", JSON.stringify(port));
    sessionStorage.setItem("freightiq_cargo", JSON.stringify(form));
    navigate(`/dashboard/port/${port.id}`);
  };

  return (
    <div className="p-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
          Good morning, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm" style={{ color: "#5a7d96" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {user?.company}
        </p>
      </div>

      {/* KPI Row — real, derived from CSV data (replaces the previously hardcoded BDI/C5TC ticker) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Vessels Tracked" value={`${stats?.vesselsTracked ?? "—"}`} sub={`as of ${stats?.dataAsOf ?? "—"}`} />
        <KpiCard label="Ports Monitored" value={`${stats?.portsMonitored ?? "—"}`} sub="East Coast India" />
        <KpiCard label="Vessels Waiting" value={`${stats?.totalWaiting ?? "—"}`} sub="across all ports" color={stats && stats.totalWaiting > 0 ? "#f59e0b" : "#10b981"} />
        <KpiCard label="Data Coverage" value="Aug 10–31" sub="12 captured snapshot days" />
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 px-4 py-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <span className="text-xs" style={{ color: "#f59e0b" }}>
            Supabase isn't connected — analyses you submit below won't be saved to the shared history yet. See <code className="mono">.env.example</code>.
          </span>
        </div>
      )}

      {/* Main grid: Form + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cargo Input Form */}
        <div id="voyage-requirements" ref={formRef} className="rounded-xl card-glass p-6 transition-shadow">
          <h2 className="text-base font-bold mb-5" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Voyage Requirements
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Cargo Type</label>
                <select
                  value={form.cargoType}
                  onChange={(e) => setForm({ ...form, cargoType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
                >
                  {CARGO_TYPES.map((c) => <option key={c} value={c} style={{ background: "#0e1e30" }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Quantity (MT)</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Load Port (Origin)</label>
                <select
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
                >
                  {EAST_COAST_PORTS.map((p) => <option key={p.id} value={p.name} style={{ background: "#0e1e30" }}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Destination Port</label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Vizag, India"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Vessel Preference</label>
                <select
                  value={form.vesselPreference}
                  onChange={(e) => setForm({ ...form, vesselPreference: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
                >
                  {VESSEL_PREFS.map((v) => <option key={v} value={v} style={{ background: "#0e1e30" }}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Contract Duration</label>
                <select
                  value={form.contractDuration}
                  onChange={(e) => setForm({ ...form, contractDuration: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
                >
                  {DURATIONS.map((d) => <option key={d} value={d} style={{ background: "#0e1e30" }}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Laycan / Start Date</label>
              <input
                type="date"
                value={form.laycanDate}
                onChange={(e) => setForm({ ...form, laycanDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8", colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96" }}>Constraints & Notes</label>
              <textarea
                value={form.constraints}
                onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                placeholder="e.g. Max draft 14m, prefer gear-less vessel, avoid VLCC..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8" }}
              />
            </div>
            <button
              type="submit"
              disabled={submitState === "saving"}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Outfit, sans-serif" }}
            >
              {submitState === "saving" ? "Saving…" : "Apply to Analysis"}
            </button>
          </form>

          {submitState === "saved" && (
            <div className="mt-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
              <span className="text-xs" style={{ color: "#10b981" }}>Saved to Analysis History. Select a port on the map to view intelligence.</span>
            </div>
          )}
          {submitState === "error" && (
            <div className="mt-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
              <span className="text-xs" style={{ color: "#ef4444" }}>Couldn't save: {submitError}</span>
            </div>
          )}

          {/* Quick action: view selected port intelligence */}
          {selectedPort && (
            <button
              onClick={() => handleViewIntelligence(selectedPort)}
              className="w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ border: "1px solid rgba(14,202,212,0.2)", color: "#0ecad4" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(14,202,212,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              View Intelligence for {selectedPort.name} →
            </button>
          )}
        </div>

        {/* Map */}
        <div className="rounded-xl card-glass p-6">
          <EastCoastMap
            selectedPort={selectedPort}
            onSelectPort={setSelectedPort}
            onViewIntelligence={handleViewIntelligence}
          />
        </div>
      </div>

      {/* Recent Activity — real, from vessel_snapshots.csv for the latest captured date */}
      <div className="mt-6 rounded-xl card-glass p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Live Port Activity</h2>
          <span className="text-xs mono px-3 py-1 rounded" style={{ background: "rgba(14,202,212,0.08)", color: "#5a7d96" }}>
            Real data · as of {stats?.dataAsOf ?? "—"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(14,202,212,0.08)" }}>
                {["Port", "Working", "Waiting", "Expected", "Total Vessels"].map((h) => (
                  <th key={h} className="pb-3 text-left font-medium" style={{ color: "#5a7d96" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map((a, i) => (
                <tr
                  key={a.displayName}
                  style={{ borderBottom: i < activity.length - 1 ? "1px solid rgba(14,202,212,0.05)" : "none" }}
                >
                  <td className="py-3 font-medium" style={{ color: "#e8f1f8" }}>{a.displayName}</td>
                  <td className="py-3 mono" style={{ color: "#10b981" }}>{a.working}</td>
                  <td className="py-3 mono" style={{ color: a.waiting > 0 ? "#f59e0b" : "#5a7d96" }}>{a.waiting}</td>
                  <td className="py-3 mono" style={{ color: "#94b8d0" }}>{a.expected}</td>
                  <td className="py-3 mono font-semibold" style={{ color: "#e8f1f8" }}>{a.totalVessels}</td>
                </tr>
              ))}
              {activity.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center" style={{ color: "#5a7d96" }}>Loading port activity…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = "#e8f1f8" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="p-4 rounded-xl card-glass">
      <div className="text-xs mb-2" style={{ color: "#5a7d96" }}>{label}</div>
      <div className="text-xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color }}>{value}</div>
      <div className="text-xs" style={{ color: "#3a5c74" }}>{sub}</div>
    </div>
  );
}

