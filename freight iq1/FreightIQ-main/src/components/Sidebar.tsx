import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLiveTickerStats, type LiveTickerStats } from "../services/csvData";

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    end: true,
  },
  {
    id: "freight",
    label: "Freight Forecast",
    path: "/dashboard/freight-forecast",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: "market",
    label: "Optimal Market Entry",
    path: "/dashboard/market-entry",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "vessel",
    label: "Vessel Optimizer",
    path: "/dashboard/vessel-optimizer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
  {
    id: "idle",
    label: "Idle Scenario Analysis",
    path: "/dashboard/idle-analysis",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    id: "risk",
    label: "Risk Monitor",
    path: "/dashboard/risk-monitor",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    id: "analysis-history",
    label: "Model Analysis",
    path: "/dashboard/analysis-history",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309a5.342 5.342 0 01-.018-.447z" />
      </svg>
    ),
  },
  {
    id: "data-upload",
    label: "Data Upload",
    path: "/dashboard/data-upload",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 16.5V3.75m0 0L7.5 8.25M12 3.75l4.5 4.5M4.5 14.25v3.375A2.625 2.625 0 007.125 20.25h9.75a2.625 2.625 0 002.625-2.625V14.25"
        />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<LiveTickerStats | null>(null);

  useEffect(() => {
    getLiveTickerStats().then(setStats).catch(() => setStats(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #0c1828 0%, #0e1e30 100%)",
        borderRight: "1px solid rgba(14,202,212,0.1)",
        width: collapsed ? "64px" : "240px",
        transition: "width 0.2s ease",
        minWidth: collapsed ? "64px" : "240px",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(14,202,212,0.08)" }}>
        <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)" }}>
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M3.5 18.5l3-10 5 3.5 4-7 5 13.5H3.5z" /></svg>
        </div>
        {!collapsed && (
          <span className="font-bold text-base" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8", whiteSpace: "nowrap" }}>
            Freight<span style={{ color: "#0ecad4" }}>IQ</span>
          </span>
        )}
      </div>

      {/* Live indicator */}
      {!collapsed && (
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(14,202,212,0.06)" }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs mono" style={{ color: "#5a7d96" }}>
              {stats ? `${stats.vesselsTracked} vessels tracked · ${stats.dataAsOf}` : "Loading data…"}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {!collapsed && (
          <div className="px-5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2a4060", fontFamily: "Inter, sans-serif" }}>
              Intelligence
            </span>
          </div>
        )}
        <ul className="space-y-0.5 px-3">
          {NAV.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                end={item.end}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={({ isActive }) => ({
                  background: isActive ? "rgba(14,202,212,0.12)" : "transparent",
                  color: isActive ? "#0ecad4" : "#5a7d96",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  borderLeft: isActive ? "2px solid #0ecad4" : "2px solid transparent",
                })}
                onMouseEnter={(e) => {
                  if (!(e.currentTarget as HTMLElement).classList.contains("active")) {
                    (e.currentTarget as HTMLElement).style.color = "#94b8d0";
                    (e.currentTarget as HTMLElement).style.background = "rgba(14,202,212,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!el.getAttribute("aria-current")) {
                    el.style.color = "";
                    el.style.background = "";
                  }
                }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(14,202,212,0.08)" }}>
        {!collapsed && user && (
          <div className="mb-3">
            <div className="text-xs font-medium truncate" style={{ color: "#e8f1f8", fontFamily: "Inter, sans-serif" }}>{user.name}</div>
            <div className="text-xs truncate" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>{user.role}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all"
          style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#5a7d96"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          {!collapsed && "Log out"}
        </button>
      </div>
    </aside>
  );
}
