import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { getLiveTickerStats, type LiveTickerStats } from "../services/csvData";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<LiveTickerStats | null>(null);

  useEffect(() => {
    getLiveTickerStats().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#08111e" }}>
      <Sidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(14,202,212,0.08)", background: "rgba(12,24,40,0.8)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded transition-colors"
            style={{ color: "#5a7d96" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0ecad4")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5a7d96")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-xs mono" style={{ color: "#5a7d96" }}>
              <span>Vessels Tracked</span>
              <span style={{ color: "#0ecad4" }}>{stats?.vesselsTracked ?? "—"}</span>
              <span className="mx-2 opacity-30">|</span>
              <span>Ports Monitored</span>
              <span style={{ color: "#0ecad4" }}>{stats?.portsMonitored ?? "—"}</span>
              <span className="mx-2 opacity-30">|</span>
              <span>Waiting Now</span>
              <span style={{ color: stats && stats.totalWaiting > 0 ? "#f59e0b" : "#10b981" }}>{stats?.totalWaiting ?? "—"}</span>
              <span className="mx-2 opacity-30">|</span>
              <span>Data as of</span>
              <span style={{ color: "#94b8d0" }}>{stats?.dataAsOf ?? "—"}</span>
            </div>
            <div className="w-px h-4 opacity-20" style={{ background: "#0ecad4" }} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(14,202,212,0.15)", color: "#0ecad4", fontFamily: "Outfit, sans-serif" }}>
                AM
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
