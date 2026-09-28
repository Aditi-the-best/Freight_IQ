import { useState } from "react";
import { EAST_COAST_PORTS } from "../services/api";
import MarketEntryModule from "../components/modules/MarketEntryModule";

export default function MarketEntryPage() {
  const [selectedPortId, setSelectedPortId] = useState("paradip");
  const port = EAST_COAST_PORTS.find((p) => p.id === selectedPortId)!;
  const cargo = { cargoType: "Iron Ore", quantity: 50000, origin: port.name, destination: "Vizag, India", vesselPreference: "Supramax", contractDuration: "Spot", laycanDate: "2025-09-18", constraints: "" };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "#e8f1f8" }}>Optimal Market Entry</h1>
          <p className="text-sm mt-1" style={{ color: "#5a7d96" }}>BOOK NOW vs WAIT decisions backed by live BDI signals</p>
        </div>
        <select value={selectedPortId} onChange={(e) => setSelectedPortId(e.target.value)} className="px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: "rgba(14,202,212,0.04)", border: "1px solid rgba(14,202,212,0.2)", color: "#e8f1f8" }}>
          {EAST_COAST_PORTS.map((p) => <option key={p.id} value={p.id} style={{ background: "#0e1e30" }}>{p.name}</option>)}
        </select>
      </div>
      <MarketEntryModule port={port} cargo={cargo} />
    </div>
  );
}

