create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status public.funnel_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index funnels_status_idx on public.funnels (status);
create index funnels_updated_at_idx on public.funnels (updated_at desc);
