import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Set these in a .env file at the project root (Vite only exposes vars
// prefixed with VITE_ to client code):
//   VITE_SUPABASE_URL=https://xxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-public-key
// Run the SQL in supabase/schema.sql (in this project) once in your
// Supabase project's SQL editor before using Analysis History.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string)
  : null;

export interface AnalysisSubmission {
  id?: string;
  created_at?: string;
  submitted_by: string;
  company: string;
  cargo_type: string;
  quantity: number;
  origin: string;
  destination: string;
  vessel_preference: string;
  contract_duration: string;
  laycan_date: string;
  constraints: string | null;
}

export async function saveAnalysisSubmission(row: AnalysisSubmission): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)." };
  const { error } = await supabase.from("analysis_submissions").insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchAnalysisSubmissions(): Promise<{ data: AnalysisSubmission[]; error?: string }> {
  if (!supabase) return { data: [], error: "Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)." };
  const { data, error } = await supabase.from("analysis_submissions").select("*").order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AnalysisSubmission[] };
}
