import { supabase } from "./supabase";
/**
 * Real-data layer, sourced from /public/data/*.csv.
 *
 * IMPORTANT — data reality check (read before extending this file):
 * These CSVs (vessel_snapshots.csv, berth_operations.csv) contain vessel
 * movements, cargo volumes, and berth status across 14 East Coast India
 * ports for 12 captured snapshot dates between 2026-08-10 and 2026-08-31.
 * They do NOT contain any freight rate, price, or index column. Every
 * function below computes something real (vessel counts, congestion,
 * cargo mix, berth occupancy) from that data. Nothing in this file
 * fabricates a $/day rate — screens that need one (Freight Forecast,
 * Market Entry, Idle Analysis) use a congestion-pressure signal instead,
 * clearly labeled as such, per the project's honest-disclosure rule.
 */

export type VesselStatus = "Working" | "Waiting" | "Expected" | "Waiting & Expected";

export interface VesselRow {
  snapshotDate: string; // YYYY-MM-DD
  port: string; // raw CSV port name, e.g. "PARADIP PORT"
  status: VesselStatus;
  berthName: string;
  vesselName: string;
  vesselType: string;
  cargo: string;
  cargoCategory: string;
  quantityMts: number | null;
  direction: string;
  arrivalOrEta: string;
  berthOrEtb: string;
  etcOrEtcd: string;
}

export interface BerthRow {
  snapshotDate: string;
  port: string;
  berthName: string;
  status: "Vacant" | "Occupied" | string;
}

// Maps this app's internal port ids to the raw port name(s) used in the CSVs.
// Sagar & Sandheads is modeled as one app port but appears as two CSV ports.
export const APP_PORT_TO_CSV_NAMES: Record<string, string[]> = {
  haldia: ["HALDIA"],
  sagar: ["SAGAR", "SANDHEADS"],
  paradip: ["PARADIP PORT", "PARADIP"],
  dhamra: ["DHAMRA"],
  gopalpur: ["GOPALPUR"],
  gangavaram: ["GANGAVARAM"],
  visakhapatnam: ["VISAKHAPATNAM"],
};

function csvNamesForPort(portId: string): string[] {
  return APP_PORT_TO_CSV_NAMES[portId] ?? [];
}

let vesselCache: VesselRow[] | null = null;
let berthCache: BerthRow[] | null = null;

/** Minimal RFC4180-ish CSV parser: handles quoted fields with embedded commas/newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip, \n handles the break */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

function toNumOrNull(v: string): number | null {
  const n = Number(v);
  return v !== "" && !Number.isNaN(n) ? n : null;
}

async function fetchCSV(path: string): Promise<string[][]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const text = await res.text();
  return parseCSV(text);
}

export async function loadVesselSnapshots(): Promise<VesselRow[]> {
  if (vesselCache) return vesselCache;

  if (!supabase) {
    throw new Error(
      "Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."
    );
  }

  const { data, error } = await supabase
    .from("vessel_snapshots")
    .select(
      `
      snapshot_date,
      port,
      status,
      berth_name,
      vessel_name,
      vessel_type,
      cargo,
      cargo_category,
      quantity_mts_numeric,
      direction,
      arrival_or_eta,
      berth_or_etb,
      etc_or_etcd
      `
    )
    .order("snapshot_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load vessel snapshots: ${error.message}`);
  }

  vesselCache = (data ?? []).map((r) => ({
    snapshotDate: r.snapshot_date,
    port: r.port?.trim().toUpperCase() ?? "",
    status: r.status as VesselStatus,
    berthName: r.berth_name ?? "",
    vesselName: r.vessel_name ?? "",
    vesselType: r.vessel_type ?? "",
    cargo: r.cargo ?? "",
    cargoCategory: r.cargo_category ?? "",
    quantityMts: r.quantity_mts_numeric !== null
      ? Number(r.quantity_mts_numeric)
      : null,
    direction: r.direction ?? "",
    arrivalOrEta: r.arrival_or_eta ?? "",
    berthOrEtb: r.berth_or_etb ?? "",
    etcOrEtcd: r.etc_or_etcd ?? "",
  }));

  return vesselCache;
}

export async function loadBerthOperations(): Promise<BerthRow[]> {
  if (berthCache) return berthCache;

  if (!supabase) {
    throw new Error(
      "Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."
    );
  }

  const { data, error } = await supabase
    .from("berth_operations")
    .select(
      `
      snapshot_date,
      port,
      berth_name,
      status
      `
    )
    .order("snapshot_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load berth operations: ${error.message}`);
  }

  berthCache = (data ?? []).map((r) => ({
    snapshotDate: r.snapshot_date,
    port: r.port?.trim().toUpperCase() ?? "",
    berthName: r.berth_name ?? "",
    status: (r.status ?? "").trim(),
  }));

  return berthCache;
}

/** All 12 real snapshot dates present in the data, sorted ascending. */
export async function getAvailableDates(): Promise<string[]> {
  const rows = await loadVesselSnapshots();
  return Array.from(new Set(rows.map((r) => r.snapshotDate))).sort();
}

export async function getLatestSnapshotDate(): Promise<string> {
  const dates = await getAvailableDates();
  return dates[dates.length - 1];
}

export interface PortActivitySummary {
  port: string; // raw CSV name (or app id if aggregated, e.g. "sagar")
  working: number;
  waiting: number;
  expected: number;
  totalVessels: number;
}

/** Working/waiting/expected vessel counts per port for a given snapshot date (defaults to latest). */
export async function getPortActivity(date?: string): Promise<PortActivitySummary[]> {
  const rows = await loadVesselSnapshots();
  const targetDate = date ?? (await getLatestSnapshotDate());
  const byPort = new Map<string, PortActivitySummary>();
  for (const r of rows) {
    if (r.snapshotDate !== targetDate) continue;
    if (!byPort.has(r.port)) byPort.set(r.port, { port: r.port, working: 0, waiting: 0, expected: 0, totalVessels: 0 });
    const s = byPort.get(r.port)!;
    if (r.status === "Working") s.working++;
    else if (r.status === "Waiting") s.waiting++;
    else if (r.status === "Expected") s.expected++;
    else if (r.status === "Waiting & Expected") { s.waiting++; s.expected++; }
    s.totalVessels++;
  }
  return Array.from(byPort.values()).sort((a, b) => b.totalVessels - a.totalVessels);
}

/**
 * Berth occupancy % for a given app port id + date.
 *
 * IMPORTANT: berth_operations.csv only logs VACANT berths (there is no
 * "Occupied" status anywhere in the file, and only 6 of 14 ports appear in
 * it at all — Paradip, Haldia, and Sagar/Sandheads have no rows). So the
 * vacant count for a date is real, but it cannot be turned into an
 * occupancy % without a real total-berths denominator. `totalBerths` must
 * be supplied by the caller from published port-authority figures
 * (EAST_COAST_PORTS in api.ts) — this function never guesses one.
 * Returns null when the port has no berth_operations rows at all (no
 * vacancy data captured for it), which callers must handle explicitly
 * rather than defaulting to a fabricated number.
 */
export async function getBerthOccupancy(appPortId: string, totalBerths: number, date?: string): Promise<{ total: number; vacant: number; occupied: number; occupancyPct: number } | null> {
  const rows = await loadBerthOperations();
  const targetDate = date ?? (await getLatestSnapshotDate());
  const csvNames = csvNamesForPort(appPortId);
  const matches = rows.filter((r) => r.snapshotDate === targetDate && csvNames.includes(r.port));
  if (matches.length === 0) return null; // no vacancy log captured for this port
  const vacant = new Set(matches.filter((r) => r.status.toLowerCase() === "vacant").map((r) => r.berthName)).size;
  const occupied = Math.max(0, totalBerths - vacant);
  return { total: totalBerths, vacant, occupied, occupancyPct: totalBerths > 0 ? Math.round((occupied / totalBerths) * 100) : 0 };
}

/**
 * Congestion Pressure Index (0-100), a REAL but directional signal — not a rate.
 * Formula: 60% weight on waiting-vessel pressure (waiting / (working+waiting), scaled),
 * 40% weight on berth occupancy. Both inputs are actual counts from the CSVs.
 */
export async function getCongestionIndex(appPortId: string, totalBerths: number, date: string): Promise<number | null> {
  const vessels = await loadVesselSnapshots();
  const csvNames = csvNamesForPort(appPortId);
  const dayRows = vessels.filter((r) => r.snapshotDate === date && csvNames.includes(r.port));
  if (dayRows.length === 0) return null;
  const working = dayRows.filter((r) => r.status === "Working").length;
  const waiting = dayRows.filter((r) => r.status === "Waiting" || r.status === "Waiting & Expected").length;
  const queuePressure = working + waiting > 0 ? waiting / (working + waiting) : 0;

  const occ = await getBerthOccupancy(appPortId, totalBerths, date);
  const occupancyPressure = occ ? occ.occupancyPct / 100 : 0.5; // no vacancy log for this port — neutral weight

  const index = queuePressure * 60 + occupancyPressure * 40;
  return Math.round(Math.min(100, Math.max(0, index)));
}

/** Congestion index across every real snapshot date, for charting. */
export async function getCongestionSeries(appPortId: string, totalBerths: number): Promise<{ date: string; index: number }[]> {
  const dates = await getAvailableDates();
  const out: { date: string; index: number }[] = [];
  for (const d of dates) {
    const idx = await getCongestionIndex(appPortId, totalBerths, d);
    if (idx !== null) out.push({ date: d, index: idx });
  }
  return out;
}

export interface CargoMixEntry { category: string; totalMt: number; vesselCount: number; }

export async function getCargoMix(appPortId: string, date?: string): Promise<CargoMixEntry[]> {
  const rows = await loadVesselSnapshots();
  const targetDate = date ?? (await getLatestSnapshotDate());
  const csvNames = csvNamesForPort(appPortId);
  const dayRows = rows.filter((r) => r.snapshotDate === targetDate && csvNames.includes(r.port));
  const byCat = new Map<string, CargoMixEntry>();
  for (const r of dayRows) {
    const cat = r.cargoCategory || "Uncategorized";
    if (!byCat.has(cat)) byCat.set(cat, { category: cat, totalMt: 0, vesselCount: 0 });
    const c = byCat.get(cat)!;
    c.totalMt += r.quantityMts ?? 0;
    c.vesselCount++;
  }
  return Array.from(byCat.values()).sort((a, b) => b.totalMt - a.totalMt);
}

/** Waiting-vessel detail list for a port on a date — used for the "why is this congested" drilldown. */
export async function getWaitingVessels(appPortId: string, date?: string): Promise<VesselRow[]> {
  const rows = await loadVesselSnapshots();
  const targetDate = date ?? (await getLatestSnapshotDate());
  const csvNames = csvNamesForPort(appPortId);
  return rows.filter((r) => r.snapshotDate === targetDate && csvNames.includes(r.port) && (r.status === "Waiting" || r.status === "Waiting & Expected"));
}

export interface VesselAtPort {
  vesselName: string;
  status: VesselStatus;
  cargo: string;
  quantityMts: number | null;
}

/** All vessels currently at, waiting at, or expected at a given app port id (defaults to latest snapshot date). */
export async function getVesselsAtPort(appPortId: string, date?: string): Promise<VesselAtPort[]> {
  const rows = await loadVesselSnapshots();
  const targetDate = date ?? (await getLatestSnapshotDate());
  const csvNames = csvNamesForPort(appPortId);
  return rows
    .filter((r) => r.snapshotDate === targetDate && csvNames.includes(r.port))
    .map((r) => ({
      vesselName: r.vesselName || "Unknown Vessel",
      status: r.status,
      cargo: r.cargo || r.cargoCategory || "—",
      quantityMts: r.quantityMts,
    }));
}

/** Working/waiting/expected counts for one app port id (aggregating any mapped CSV port names), for a given date. */
export async function getPortActivityForAppPort(appPortId: string, date?: string): Promise<PortActivitySummary> {
  const rows = await loadVesselSnapshots();
  const targetDate = date ?? (await getLatestSnapshotDate());
  const csvNames = csvNamesForPort(appPortId);
  const s: PortActivitySummary = { port: appPortId, working: 0, waiting: 0, expected: 0, totalVessels: 0 };
  for (const r of rows) {
    if (r.snapshotDate !== targetDate || !csvNames.includes(r.port)) continue;
    if (r.status === "Working") s.working++;
    else if (r.status === "Waiting") s.waiting++;
    else if (r.status === "Expected") s.expected++;
    else if (r.status === "Waiting & Expected") { s.waiting++; s.expected++; }
    s.totalVessels++;
  }
  return s;
}

/** Port activity for every app-modeled port (the 7 ports this app covers), for a given date. Sagar & Sandheads combined into one row, matching how the app models that port. */
export async function getPortActivityForAppPorts(appPortIds: string[], date?: string): Promise<PortActivitySummary[]> {
  const targetDate = date ?? (await getLatestSnapshotDate());
  const out: PortActivitySummary[] = [];
  for (const id of appPortIds) {
    out.push(await getPortActivityForAppPort(id, targetDate));
  }
  return out;
}

export interface LiveTickerStats {
  dataAsOf: string;
  vesselsTracked: number;
  portsMonitored: number;
  totalWaiting: number;
}

/**
 * Real summary stats used in the top ticker/sidebar, replacing the previously
 * hardcoded BDI/C5TC numbers. Scoped to the app's 7 modeled ports (Paradip,
 * Haldia, Visakhapatnam, Gangavaram, Gopalpur, Dhamra, Sagar & Sandheads) —
 * not all 14 ports present in the raw CSVs — to match what this app covers.
 */
export async function getLiveTickerStats(): Promise<LiveTickerStats> {
  const date = await getLatestSnapshotDate();
  const appPortIds = Object.keys(APP_PORT_TO_CSV_NAMES);
  const activity = await getPortActivityForAppPorts(appPortIds, date);
  const vesselsTracked = activity.reduce((a, p) => a + p.totalVessels, 0);
  const totalWaiting = activity.reduce((a, p) => a + p.waiting, 0);
  return { dataAsOf: date, vesselsTracked, portsMonitored: appPortIds.length, totalWaiting };
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
export { fmtShortDate };
