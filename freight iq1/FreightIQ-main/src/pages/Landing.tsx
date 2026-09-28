import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    title: "Congestion Intelligence",
    desc: "A real Congestion Pressure Index built from vessel queue and berth data — not a fabricated rate forecast.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Optimal Market Entry",
    desc: "BOOK NOW / MONITOR / WAIT calls backed by real vessel queue and berth-occupancy data.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
    title: "Vessel Optimization",
    desc: "Match cargo specs to optimal vessels with draft, LOA, and port-compatibility analysis.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    title: "Risk Intelligence",
    desc: "Real-time market, port, and demand risk scoring with early-warning alert system.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
    title: "Port Intelligence",
    desc: "Interactive East Coast India map with berth data, congestion levels, and port-specific insights.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    title: "Idle Cost Scenarios",
    desc: "7/14/21-day idle scenario modeling with economic breakeven analysis.",
  },
];

const STATS = [
  { value: "7", label: "EC India Ports Monitored" },
  { value: "12", label: "Days of Captured Vessel Data" },
  { value: "138 MT", label: "Paradip Annual Throughput" },
  { value: "100%", label: "Real Vessel & Berth Data" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #08111e 0%, #0c1828 50%, #08111e 100%)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "rgba(14,202,212,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)" }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M3.5 18.5l3-10 5 3.5 4-7 5 13.5H3.5z" />
            </svg>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Freight<span style={{ color: "#0ecad4" }}>IQ</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-sm px-4 py-2 rounded transition-colors"
            style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0ecad4")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94b8d0")}
          >
            Log In
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="text-sm px-5 py-2 rounded font-medium transition-all"
            style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Inter, sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 pt-24 pb-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 mono" style={{ background: "rgba(14,202,212,0.08)", border: "1px solid rgba(14,202,212,0.2)", color: "#0ecad4" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
          AI-Powered Maritime Intelligence Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
          Navigate Freight Markets{" "}
          <span className="gradient-text">with Precision</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>
          FreightIQ turns real vessel, berth, and cargo data into congestion intelligence, vessel-matching, and port risk signals for East Coast India's major bulk ports.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="px-8 py-3.5 rounded-lg font-semibold text-base transition-all"
            style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Outfit, sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Launch Dashboard →
          </button>
          <button
            className="px-8 py-3.5 rounded-lg font-medium text-base transition-all"
            style={{ border: "1px solid rgba(14,202,212,0.3)", color: "#0ecad4", fontFamily: "Outfit, sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(14,202,212,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            View Demo
          </button>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(14,202,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,202,212,0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="px-8 py-12 border-y" style={{ borderColor: "rgba(14,202,212,0.08)", background: "rgba(14,202,212,0.02)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold mb-1 gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Everything a Logistics Manager Needs
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>
            Six integrated intelligence modules working together from a single platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl transition-all"
              style={{ background: "rgba(14, 30, 48, 0.8)", border: "1px solid rgba(14,202,212,0.1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.1)")}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(14,202,212,0.1)", color: "#0ecad4" }}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8", fontSize: "1rem" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center" style={{ background: "linear-gradient(180deg, transparent, rgba(14,202,212,0.04), transparent)" }}>
        <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
          Ready to optimize your next charter?
        </h2>
        <p className="mb-8 text-base" style={{ color: "#5a7d96" }}>
          Real vessel and port data, honest signals — no fabricated rates.
        </p>
        <button
          onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
          className="px-10 py-4 rounded-lg font-bold text-base"
          style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Outfit, sans-serif" }}
        >
          Get Started — Free
        </button>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t flex items-center justify-between text-xs" style={{ borderColor: "rgba(14,202,212,0.08)", color: "#5a7d96" }}>
        <span style={{ fontFamily: "Outfit, sans-serif" }}>FreightIQ © 2025 — Maritime Intelligence Platform</span>
        <span>East Coast India | Bulk Freight Analytics</span>
      </footer>
    </div>
  );
}

