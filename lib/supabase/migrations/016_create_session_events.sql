-- Create session_events table for grading instrumentation
-- Safe to run multiple times

create extension if not exists "pgcrypto";

create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  event_type text not null,
  timestamp timestamptz not null default now(),
  data jsonb
);

-- Basic indexes for querying
create index if not exists idx_session_events_session on public.session_events (session_id);
create index if not exists idx_session_events_type on public.session_events (event_type);
create index if not exists idx_session_events_ts on public.session_events (timestamp desc);

-- Optional: keep RLS disabled for now since server uses service role
-- alter table public.session_events enable row level security;
-- You can add restrictive policies later if needed


