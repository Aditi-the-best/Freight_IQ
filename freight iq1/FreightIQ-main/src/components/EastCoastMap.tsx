import { useEffect, useState } from "react";
import { EAST_COAST_PORTS, getLivePortStatuses, type Port } from "../services/api";

// Approximate SVG coordinates for East Coast India ports
// ViewBox: 0 0 400 600, representing roughly Kolkata(top) to Visakhapatnam(bottom)
const PORT_SVG_POS: Record<string, { x: number; y: number }> = {
  haldia:        { x: 248, y: 52 },
  sagar:         { x: 262, y: 120 },
  paradip:       { x: 230, y: 198 },
  dhamra:        { x: 245, y: 155 },
  gopalpur:      { x: 210, y: 310 },
  gangavaram:    { x: 195, y: 420 },
  visakhapatnam: { x: 200, y: 405 },
};

const COASTLINE = "M 280,20 C 278,35 275,50 270,68 C 265,88 260,105 265,125 C 268,140 270,155 265,170 C 258,188 245,200 238,215 C 230,232 228,250 220,268 C 212,285 205,300 208,318 C 210,332 215,345 210,360 C 205,378 196,390 192,408 C 188,425 190,445 185,462 C 180,480 170,495 165,510";

interface EastCoastMapProps {
  selectedPort: Port | null;
  onSelectPort: (port: Port) => void;
  onViewIntelligence: (port: Port) => void;
}

export default function EastCoastMap({ selectedPort, onSelectPort, onViewIntelligence }: EastCoastMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, Port["status"]>>({});

  useEffect(() => {
    getLivePortStatuses().then(setLiveStatuses).catch(() => setLiveStatuses({}));
  }, []);

  const statusFor = (port: Port): Port["status"] => liveStatuses[port.id] ?? port.status;

  const getStatusColor = (status: Port["status"]) => {
    if (status === "operational") return "#10b981";
    if (status === "congested") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: "480px" }}>
      {/* Map header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#e8f1f8", fontFamily: "Outfit, sans-serif" }}>East Coast India · Port Map</h3>
          <p className="text-xs mt-0.5" style={{ color: "#5a7d96" }}>Select a port to access Port Intelligence</p>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
          <span className="flex items-center gap-1.5" style={{ color: "#5a7d96" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} /> Operational
          </span>
          <span className="flex items-center gap-1.5" style={{ color: "#5a7d96" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} /> Congested
          </span>
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative flex-1 rounded-xl overflow-hidden" style={{ background: "linear-gradient(145deg, #071525, #0a1b2e)", border: "1px solid rgba(14,202,212,0.1)" }}>
        {/* Ocean grid */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 560">
          <defs>
            <pattern id="ocean-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(14,202,212,0.05)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="land-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#162840" />
              <stop offset="100%" stopColor="#1e3650" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Ocean background */}
          <rect width="400" height="560" fill="url(#ocean-grid)" />

          {/* Bay of Bengal label */}
          <text x="320" y="300" fill="rgba(14,202,212,0.15)" fontSize="10" fontFamily="JetBrains Mono, monospace" transform="rotate(-90, 320, 300)">BAY OF BENGAL</text>

          {/* Indian land mass (simplified East Coast) */}
          <path
            d="M 0,0 L 280,0 C 278,35 275,50 270,68 C 265,88 260,105 265,125 C 268,140 270,155 265,170 C 258,188 245,200 238,215 C 230,232 228,250 220,268 C 212,285 205,300 208,318 C 210,332 215,345 210,360 C 205,378 196,390 192,408 C 188,425 190,445 185,462 C 180,480 170,495 165,510 L 0,510 Z"
            fill="url(#land-grad)"
            stroke="rgba(14,202,212,0.2)"
            strokeWidth="1.5"
          />

          {/* State boundaries (dashed) */}
          <line x1="0" y1="140" x2="265" y2="140" stroke="rgba(14,202,212,0.08)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="330" x2="210" y2="330" stroke="rgba(14,202,212,0.08)" strokeWidth="1" strokeDasharray="4,4" />

          {/* State labels */}
          <text x="80" y="95" fill="rgba(148,184,208,0.3)" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500">WEST BENGAL</text>
          <text x="60" y="240" fill="rgba(148,184,208,0.3)" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500">ODISHA</text>
          <text x="50" y="440" fill="rgba(148,184,208,0.3)" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="500">ANDHRA PRADESH</text>

          {/* Ports */}
          {EAST_COAST_PORTS.map((port) => {
            const pos = PORT_SVG_POS[port.id];
            if (!pos) return null;
            const isSelected = selectedPort?.id === port.id;
            const isHovered = hovered === port.id;
            const color = getStatusColor(statusFor(port));
            const highlight = isSelected || isHovered;

            return (
              <g
                key={port.id}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectPort(port)}
                onMouseEnter={() => setHovered(port.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Ripple for selected */}
                {isSelected && (
                  <>
                    <circle cx={pos.x} cy={pos.y} r="18" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
                    <circle cx={pos.x} cy={pos.y} r="12" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                  </>
                )}

                {/* Port dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={highlight ? 7 : 5}
                  fill={color}
                  opacity={highlight ? 1 : 0.8}
                  filter={highlight ? "url(#glow)" : undefined}
                  style={{ transition: "r 0.15s ease" }}
                />
                <circle cx={pos.x} cy={pos.y} r="2" fill="white" opacity="0.9" />

                {/* Port name label */}
                <text
                  x={pos.x + 10}
                  y={pos.y + 4}
                  fill={isSelected ? "#0ecad4" : isHovered ? "#94b8d0" : "#5a7d96"}
                  fontSize="9"
                  fontFamily="Inter, sans-serif"
                  fontWeight={highlight ? "600" : "400"}
                  style={{ transition: "fill 0.15s ease" }}
                >
                  {port.name}
                </text>
              </g>
            );
          })}

          {/* Compass */}
          <g transform="translate(355, 50)">
            <circle cx="0" cy="0" r="18" fill="rgba(14,30,48,0.8)" stroke="rgba(14,202,212,0.2)" strokeWidth="1" />
            <text x="0" y="-8" textAnchor="middle" fill="rgba(14,202,212,0.6)" fontSize="7" fontFamily="Inter, sans-serif">N</text>
            <text x="0" y="13" textAnchor="middle" fill="rgba(14,202,212,0.3)" fontSize="6" fontFamily="Inter, sans-serif">S</text>
            <text x="10" y="3" textAnchor="middle" fill="rgba(14,202,212,0.3)" fontSize="6" fontFamily="Inter, sans-serif">E</text>
            <text x="-10" y="3" textAnchor="middle" fill="rgba(14,202,212,0.3)" fontSize="6" fontFamily="Inter, sans-serif">W</text>
            <line x1="0" y1="-13" x2="0" y2="-6" stroke="#0ecad4" strokeWidth="1.5" opacity="0.7" />
          </g>
        </svg>
      </div>

      {/* Selected port card */}
      {selectedPort && (
        <div
          className="mt-4 p-4 rounded-xl animate-fade-in"
          style={{ background: "rgba(14,202,212,0.05)", border: "1px solid rgba(14,202,212,0.2)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: getStatusColor(statusFor(selectedPort)) }} />
                <h4 className="font-bold text-sm" style={{ color: "#e8f1f8", fontFamily: "Outfit, sans-serif" }}>{selectedPort.name}</h4>
                <span className="text-xs mono px-2 py-0.5 rounded" style={{ background: "rgba(14,202,212,0.08)", color: "#5a7d96" }}>
                  {selectedPort.state}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: "#5a7d96", fontFamily: "JetBrains Mono, monospace" }}>
                <span>{selectedPort.berths} berths</span>
                <span>Draft {selectedPort.maxDraft}m</span>
                <span>LOA {selectedPort.maxLOA}m</span>
                <span>{selectedPort.throughput}</span>
              </div>
            </div>
            <button
              onClick={() => onViewIntelligence(selectedPort)}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0ecad4, #0a9da6)", color: "#08111e", fontFamily: "Outfit, sans-serif" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              View Port Intelligence →
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selectedPort.cargoTypes.map((ct) => (
              <span key={ct} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(14,202,212,0.06)", color: "#5a7d96", fontFamily: "Inter, sans-serif" }}>
                {ct}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
