-- AetherMind · Migration 002 · Questions Table
-- Run after Migration 001 (am_scores must exist first)
-- Supabase SQL Editor → paste all → Run

create table if not exists public.am_questions (
  id             uuid        primary key default gen_random_uuid(),
  realm_id       int         not null,
  realm_name     text        not null,
  level_min      int         not null default 1,
  level_max      int         not null default 50,
  question       text        not null,
  options        jsonb       not null,
  correct_idx    int         not null check (correct_idx between 0 and 3),
  knowledge_type text        not null check (knowledge_type in ('empirical','historical','philosophical','esoteric','channeled','speculative')),
  explanation    text        not null,
  insight        text,
  cross_refs     jsonb       not null default '[]',
  image_search   text,
  image_url      text,
  game_modes     text[]      not null default '{classic,speed,survival,gauntlet,blind}',
  tags           text[]      not null default '{}',
  times_shown    int         not null default 0,
  times_correct  int         not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists am_q_realm_idx   on public.am_questions (realm_id);
create index if not exists am_q_level_idx   on public.am_questions (level_min, level_max);
create index if not exists am_q_shown_idx   on public.am_questions (times_shown asc);

-- RLS: anyone can read questions, only server can update stats
alter table public.am_questions enable row level security;
drop policy if exists "am_q_public_read"   on public.am_questions;
drop policy if exists "am_q_public_update" on public.am_questions;
create policy "am_q_public_read"   on public.am_questions for select using (true);
create policy "am_q_public_update" on public.am_questions for update using (true);

-- Realtime (optional — useful for live question updates)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'am_questions'
  ) then alter publication supabase_realtime add table public.am_questions; end if;
end; $$;

select 'Migration 002 complete' as status, count(*) as question_count from public.am_questions;
