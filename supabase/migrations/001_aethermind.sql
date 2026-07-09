-- AetherMind · Migration 001 · Leaderboard
-- Run in Supabase SQL Editor: supabase.com → SQL Editor → New query → paste → Run
-- Idempotent: safe to run multiple times

-- SCORES TABLE
create table if not exists public.am_scores (
  id              uuid        primary key default gen_random_uuid(),
  player_name     text        not null unique,
  level           int         not null default 1,
  total_correct   int         not null default 0,
  total_answered  int         not null default 0,
  xp              int         not null default 0,
  realm_scores    jsonb       not null default '{}',
  attributes      jsonb       not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- INDEXES
create index if not exists am_scores_xp_idx    on public.am_scores (xp desc);
create index if not exists am_scores_name_idx  on public.am_scores (player_name);
create index if not exists am_scores_level_idx on public.am_scores (level desc);

-- AUTO-UPDATE TIMESTAMP
create or replace function public.am_set_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists am_scores_updated_at on public.am_scores;
create trigger am_scores_updated_at
  before update on public.am_scores
  for each row execute function public.am_set_updated_at();

-- ROW LEVEL SECURITY
alter table public.am_scores enable row level security;

drop policy if exists "am_public_read"   on public.am_scores;
drop policy if exists "am_public_insert" on public.am_scores;
drop policy if exists "am_public_update" on public.am_scores;

create policy "am_public_read"   on public.am_scores for select using (true);
create policy "am_public_insert" on public.am_scores for insert with check (true);
create policy "am_public_update" on public.am_scores for update using (true);

-- REALTIME
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'am_scores'
  ) then alter publication supabase_realtime add table public.am_scores; end if;
end; $$;

-- LEADERBOARD VIEW
create or replace view public.am_leaderboard as
select
  row_number() over (order by xp desc) as rank,
  player_name, level, xp, total_correct, total_answered,
  case when total_answered = 0 then 0
    else round(total_correct::numeric / total_answered * 100, 1) end as accuracy_pct,
  updated_at
from public.am_scores order by xp desc;

-- VERIFY
do $$ declare
  t boolean; r boolean; s boolean;
begin
  select exists(select 1 from information_schema.tables where table_name='am_scores') into t;
  select exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='am_scores') into r;
  select relrowsecurity from pg_class where relname='am_scores' into s;
  raise notice 'AetherMind DB Setup:';
  raise notice '  Table am_scores: %', case when t then 'EXISTS' else 'MISSING' end;
  raise notice '  Realtime: %', case when r then 'ENABLED' else 'DISABLED' end;
  raise notice '  RLS: %', case when s then 'ENABLED' else 'DISABLED' end;
end; $$;

select 'Migration 001 complete' as status, count(*) as player_count from public.am_scores;
