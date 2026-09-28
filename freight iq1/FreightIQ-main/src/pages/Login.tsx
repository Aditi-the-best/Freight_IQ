import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(name, email, password, company);
      }
      navigate("/dashboard");
    } catch {
      setError("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#08111e" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(145deg, rgba(12, 24, 40, 0.78), rgba(14, 30, 48, 0.88)), url('/hero-ship.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(14,202,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,202,212,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)" }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M3.5 18.5l3-10 5 3.5 4-7 5 13.5H3.5z" /></svg>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Freight<span style={{ color: "#0ecad4" }}>IQ</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-snug mb-6" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
            Intelligence for every<br />
            <span className="gradient-text">freight decision.</span>
          </h2>
          <div className="space-y-4">
            {[
              "AI freight rate forecasting with 78% accuracy",
              "7 East Coast India ports with live intelligence",
              "Real-time market entry recommendations",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#0ecad4" }} />
                <span className="text-sm" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative chart lines */}
        <div className="relative z-10">
          <svg viewBox="0 0 400 100" className="w-full opacity-30">
            <polyline points="0,80 50,65 100,70 150,45 200,50 250,35 300,42 350,25 400,30" fill="none" stroke="#0ecad4" strokeWidth="2" />
            <polyline points="0,90 50,85 100,88 150,75 200,78 250,68 300,72 350,58 400,62" fill="none" stroke="#5a7d96" strokeWidth="1.5" strokeDasharray="4,4" />
          </svg>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs mono" style={{ color: "#5a7d96" }}>Historical rates</span>
            <span className="text-xs mono" style={{ color: "#0ecad4" }}>AI Forecast</span>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>
              {mode === "login" ? "Sign in to your FreightIQ workspace" : "Start your 14-day free trial"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg p-1 mb-8" style={{ background: "rgba(14,202,212,0.06)", border: "1px solid rgba(14,202,212,0.12)" }}>
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded text-sm font-medium transition-all"
                style={{
                  background: mode === m ? "rgba(14,202,212,0.15)" : "transparent",
                  color: mode === m ? "#0ecad4" : "#5a7d96",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Mehta"
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8", fontFamily: "Inter, sans-serif" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.15)")}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Pacific Bulk Carriers Ltd."
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8", fontFamily: "Inter, sans-serif" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.15)")}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arjun@pacificbulk.com"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8", fontFamily: "Inter, sans-serif" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.15)")}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.15)", color: "#e8f1f8", fontFamily: "Inter, sans-serif" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(14,202,212,0.15)")}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "Inter, sans-serif" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg font-semibold text-sm transition-all mt-2"
              style={{ background: loading ? "rgba(14,202,212,0.4)" : "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Outfit, sans-serif" }}
            >
              {loading ? "Authenticating…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: "rgba(14,202,212,0.08)" }}>
            <p className="text-xs" style={{ color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>
              By continuing, you agree to FreightIQ's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

