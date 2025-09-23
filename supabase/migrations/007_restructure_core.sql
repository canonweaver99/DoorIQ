-- Create new core tables: scenarios, sessions, turns, scores
-- Keep agents and storage; drop/replace prior training/attempt schemas

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  persona jsonb not null default '{}'::jsonb,
  script jsonb not null default '{}'::jsonb
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  started_at timestamptz default now(),
  ended_at timestamptz,
  scenario_id uuid references scenarios(id)
);

create table if not exists turns (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  speaker text check (speaker in ('rep','homeowner')) not null,
  text text not null,
  ts timestamptz default now(),
  latency_ms int,
  asr_confidence numeric
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  rubric jsonb not null default '{}'::jsonb,
  total numeric,
  notes text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_sessions_scenario on sessions(scenario_id);
create index if not exists idx_turns_session on turns(session_id);
create index if not exists idx_scores_session on scores(session_id);

-- RLS (open for now; tighten later)
alter table scenarios enable row level security;
alter table sessions enable row level security;
alter table turns enable row level security;
alter table scores enable row level security;

create policy "read_scenarios" on scenarios for select using (true);
create policy "manage_sessions" on sessions for all using (true);
create policy "manage_turns" on turns for all using (true);
create policy "manage_scores" on scores for all using (true);

-- Seed default scenario for Amanda if not present
insert into scenarios (name, persona, script)
values (
  'Amanda Rodriguez - Suburban Mom',
  '{
    "name":"Amanda Rodriguez",
    "age":34,
    "family":"Married to David; kids Sofia (6) and Lucas (3); dog Bailey",
    "values":["child safety","pet safety","clear pricing","on-time"],
    "style":"polite but time-constrained",
    "questions":["Is this safe for kids and pets?","What''s included?","How much and when can you come?"],
    "objections":["Need to check with my husband","Not in budget","Email me details"],
    "preferred_window":"Wednesday morning"
  }'::jsonb,
  '{
    "opening":"Yes? What can I help you with?",
    "hints":["Address safety first","Offer a clear time window","Be concise"],
    "success":"Let''s do a trial. Wednesday 9–11 AM, text me 30 minutes before.",
    "soft_yes":"Send the written quote for Wednesday morning; I''ll confirm tonight.",
    "not_now":"We''re slammed—email me and check next week.",
    "no":"Thanks, but not interested."
  }'::jsonb
)
on conflict do nothing;

-- Optional: drop obsolete tables from earlier prototypes
-- drop table if exists conversation_sessions cascade;
-- drop table if exists training_documents cascade;
-- drop table if exists user_level_progress cascade;
-- drop table if exists agent_training_docs cascade;


