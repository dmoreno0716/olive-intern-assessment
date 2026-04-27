create table public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  screen_id text not null,
  screen_index integer not null,
  answer jsonb,
  dwell_ms integer not null default 0,
  submitted_at timestamptz not null default now()
);

create index responses_session_id_idx on public.responses (session_id);
create index responses_screen_idx on public.responses (session_id, screen_index);
