-- Run this once in your Supabase project's SQL editor (Project > SQL Editor > New query).
-- Creates the table that stores every "Apply to Analysis" submission so any
-- manager, on any device, can see the shared history.

create table if not exists analysis_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_by text not null,
  company text not null,
  cargo_type text not null,
  quantity numeric not null,
  origin text not null,
  destination text not null,
  vessel_preference text not null,
  contract_duration text not null,
  laycan_date date,
  constraints text
);

-- Row Level Security: allow any signed-in (or anon, if you don't add auth)
-- client using the anon key to read and insert. Tighten this once you add
-- real user accounts.
alter table analysis_submissions enable row level security;

create policy "Allow read for all" on analysis_submissions
  for select using (true);

create policy "Allow insert for all" on analysis_submissions
  for insert with check (true);
