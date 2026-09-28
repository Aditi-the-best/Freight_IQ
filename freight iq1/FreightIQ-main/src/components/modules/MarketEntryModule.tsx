import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMarketEntry, type Port, type CargoInput, type MarketEntryData } from "../../services/api";
import { DataSourceBanner } from "./FreightForecastModule";

interface Props { port: Port; cargo: CargoInput; }

const REC_COLORS: Record<MarketEntryData["recommendation"], string> = {
  "BOOK NOW": "#10b981",
  MONITOR: "#f59e0b",
  WAIT: "#ef4444",
};

export default function MarketEntryModule({ port }: Props) {
  const [data, setData] = useState<MarketEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchMarketEntry(port).then((d) => { setData(d); setLoading(false); });
  }, [port.id]);

  if (loading) return <div className="h-64 rounded-xl animate-pulse" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.08)" }} />;
  if (!data) return null;

  const recColor = REC_COLORS[data.recommendation];
  const recBg = `${recColor}14`;
  const recBorder = `${recColor}40`;

  const goToVoyageRequirements = () => {
    // Voyage Requirements form lives on the Dashboard home page.
    navigate("/dashboard#voyage-requirements");
  };

  return (
    <div className="space-y-6">
      <DataSourceBanner text={`Recommendation derived from the real Congestion Pressure Index at ${port.name}, as of ${data.dataAsOf}. No freight-rate feed is used — this is a port-pressure signal, not a rate call.`} />

      {/* Big recommendation card — now clickable, routes to Voyage Requirements */}
      <button
        onClick={goToVoyageRequirements}
        className="w-full text-left p-8 rounded-2xl flex items-center justify-between flex-wrap gap-6 transition-transform"
        style={{ background: recBg, border: `1px solid ${recBorder}`, cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.005)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        title="Go to Voyage Requirements"
      >
        <div>
          <div className="text-xs mono mb-2" style={{ color: recColor }}>RECOMMENDATION</div>
          <div className="text-5xl font-black mb-3" style={{ fontFamily: "Outfit, sans-serif", color: recColor }}>
            {data.recommendation}
          </div>
          <div className="text-sm flex items-center gap-2" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>
            <span>Click to set up your Voyage Requirements</span>
            <span style={{ color: recColor }}>→</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="text-center">
            <div className="text-xs mono mb-1" style={{ color: "#5a7d96" }}>CONFIDENCE</div>
            <ConfidenceGauge value={data.confidence} color={recColor} />
            <div className="text-lg font-bold mt-1" style={{ color: recColor, fontFamily: "Outfit, sans-serif" }}>{data.confidence}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs mono" style={{ color: "#5a7d96" }}>CONGESTION INDEX</div>
            <div className="text-2xl font-bold" style={{ color: recColor, fontFamily: "Outfit, sans-serif" }}>{data.currentCongestionIndex}/100</div>
          </div>
        </div>
      </button>

      {/* Rate comparison card removed — no rate feed. Replaced with real congestion snapshot. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl card-glass">
          <div className="text-xs mono mb-2" style={{ color: "#5a7d96" }}>CONGESTION INDEX TREND (7d)</div>
          <div className="text-2xl font-bold" style={{ color: data.change7d > 5 ? "#ef4444" : data.change7d < -5 ? "#10b981" : "#e8f1f8", fontFamily: "Outfit, sans-serif" }}>
            {data.change7d >= 0 ? "+" : ""}{data.change7d} pts
          </div>
          <div className="text-xs mt-1" style={{ color: "#5a7d96" }}>vs. a week ago, real data</div>
        </div>
        <div className="p-5 rounded-xl card-glass">
          <div className="text-xs mono mb-2" style={{ color: "#5a7d96" }}>DATA AS OF</div>
          <div className="text-2xl font-bold" style={{ color: "#0ecad4", fontFamily: "Outfit, sans-serif" }}>{data.dataAsOf}</div>
          <div className="text-xs mt-1" style={{ color: "#5a7d96" }}>latest captured snapshot</div>
        </div>
      </div>

      {/* Rationale */}
      <div className="p-6 rounded-xl card-glass">
        <h3 className="font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Decision Rationale</h3>
        <div className="space-y-3">
          {data.rationale.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold" style={{ background: "rgba(14,202,212,0.12)", color: "#0ecad4", fontFamily: "JetBrains Mono" }}>
                {i + 1}
              </div>
              <p className="text-sm" style={{ color: "#94b8d0", fontFamily: "Inter, sans-serif" }}>{r}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={goToVoyageRequirements}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all"
        style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Outfit, sans-serif" }}
      >
        Go to Voyage Requirements →
      </button>
    </div>
  );
}

function ConfidenceGauge({ value, color }: { value: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(14,202,212,0.08)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}
