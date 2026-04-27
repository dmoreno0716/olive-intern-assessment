create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  variant_id uuid not null references public.variants (id) on delete cascade,
  source text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  total_dwell_ms integer not null default 0,
  cta_clicked boolean not null default false
);

create index sessions_funnel_id_idx on public.sessions (funnel_id);
create index sessions_variant_id_idx on public.sessions (variant_id);
create index sessions_started_at_idx on public.sessions (started_at desc);
create index sessions_source_idx on public.sessions (source);
