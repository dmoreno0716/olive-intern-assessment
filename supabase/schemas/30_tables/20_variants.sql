create table public.variants (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  name text not null,
  spec jsonb not null default '[]'::jsonb,
  routing_rules jsonb not null default jsonb_build_object(
    'sources', '[]'::jsonb,
    'dwell_threshold_ms', null,
    'is_default', false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index variants_funnel_id_idx on public.variants (funnel_id);
