-- Simple sessions and turns schema
-- Sessions = a single practice call
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Turns = every line of dialog
create table if not exists turns (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  speaker text check (speaker in ('rep','homeowner')) not null,
  text text not null,
  asr_confidence numeric,          -- null for homeowner
  latency_ms int,
  started_at timestamptz default now()
);

-- Optional RLS for per-user access
alter table sessions enable row level security;
alter table turns enable row level security;

-- Anyone can read/write for now (adjust as needed)
create policy "allow_all_sessions" on sessions for all using (true);
create policy "allow_all_turns" on turns for all using (true);
