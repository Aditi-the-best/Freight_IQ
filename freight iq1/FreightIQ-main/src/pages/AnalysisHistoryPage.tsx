import { useEffect, useState } from "react";
import { fetchAnalysisSubmissions, isSupabaseConfigured, type AnalysisSubmission } from "../services/supabase";

export default function AnalysisHistoryPage() {
  const [rows, setRows] = useState<AnalysisSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const load = () => {
    setLoading(true);
    fetchAnalysisSubmissions().then(({ data, error }) => {
      setRows(data);
      setError(error);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 animate-fade-in" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Analysis History</h1>
          <p className="text-sm" style={{ color: "#5a7d96" }}>Every "Apply to Analysis" submission, visible to all managers.</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ border: "1px solid rgba(14,202,212,0.2)", color: "#0ecad4" }}
        >
          Refresh
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <p className="text-sm" style={{ color: "#f59e0b", fontFamily: "Inter, sans-serif" }}>
            Supabase isn't connected yet. Add <code className="mono">VITE_SUPABASE_URL</code> and <code className="mono">VITE_SUPABASE_ANON_KEY</code> to a
            <code className="mono"> .env</code> file (see <code className="mono">.env.example</code>), run <code className="mono">supabase/schema.sql</code> in your
            Supabase project, then reload. Until then, submissions aren't saved anywhere shared.
          </p>
        </div>
      )}

      {error && isSupabaseConfigured && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p className="text-sm" style={{ color: "#ef4444" }}>Couldn't load submissions: {error}</p>
        </div>
      )}

      <div className="rounded-xl card-glass p-6">
        {loading ? (
          <div className="h-40 rounded-xl animate-pulse" style={{ background: "rgba(14,202,212,0.04)" }} />
        ) : rows.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "#5a7d96" }}>No analyses submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(14,202,212,0.08)" }}>
                  {["Submitted", "By", "Company", "Cargo", "Qty (MT)", "Origin", "Destination", "Vessel Pref.", "Duration", "Laycan"].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-left font-medium whitespace-nowrap" style={{ color: "#5a7d96" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? i} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(14,202,212,0.05)" : "none" }}>
                    <td className="py-3 pr-4 mono whitespace-nowrap" style={{ color: "#94b8d0" }}>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</td>
                    <td className="py-3 pr-4" style={{ color: "#e8f1f8" }}>{r.submitted_by}</td>
                    <td className="py-3 pr-4" style={{ color: "#94b8d0" }}>{r.company}</td>
                    <td className="py-3 pr-4" style={{ color: "#94b8d0" }}>{r.cargo_type}</td>
                    <td className="py-3 pr-4 mono" style={{ color: "#94b8d0" }}>{Number(r.quantity).toLocaleString()}</td>
                    <td className="py-3 pr-4" style={{ color: "#94b8d0" }}>{r.origin}</td>
                    <td className="py-3 pr-4" style={{ color: "#94b8d0" }}>{r.destination}</td>
                    <td className="py-3 pr-4" style={{ color: "#94b8d0" }}>{r.vessel_preference}</td>
                    <td className="py-3 pr-4" style={{ color: "#94b8d0" }}>{r.contract_duration}</td>
                    <td className="py-3 pr-4 mono" style={{ color: "#94b8d0" }}>{r.laycan_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

