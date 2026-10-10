-- Money Ledger: Supabase schema
-- Run this in the SQL editor of a new Supabase project, then set
-- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
--
-- Money is stored as integer paise. Totals are never stored; the app derives them.

create table if not exists public.categories (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  type        text not null check (type in ('in', 'out', 'both')),
  color       text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.entries (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('in', 'out')),
  amount      bigint not null check (amount > 0 and amount <= 1000000000000),
  date        date not null,
  category_id text references public.categories (id) on delete set null,
  note        text not null default '' check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  settings    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, date desc);
create index if not exists categories_user_idx on public.categories (user_id);

-- Row-level security: each user sees and changes only their own rows.
alter table public.categories enable row level security;
alter table public.entries enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "categories: own rows" on public.categories;
create policy "categories: own rows" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries: own rows" on public.entries;
create policy "entries: own rows" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "settings: own rows" on public.user_settings;
create policy "settings: own rows" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Restore from backup: replace all categories and entries atomically.
create or replace function public.replace_ledger(p_categories jsonb, p_entries jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  delete from public.entries where user_id = uid;
  delete from public.categories where user_id = uid;

  insert into public.categories (id, user_id, name, type, color, archived, created_at)
  select c.id, uid, c.name, c.type, c.color, coalesce(c.archived, false), coalesce(c.created_at, now())
  from jsonb_to_recordset(p_categories)
    as c(id text, name text, type text, color text, archived boolean, created_at timestamptz);

  insert into public.entries (id, user_id, type, amount, date, category_id, note, created_at, updated_at)
  select e.id, uid, e.type, e.amount, e.date, e.category_id, coalesce(e.note, ''),
         coalesce(e.created_at, now()), coalesce(e.updated_at, now())
  from jsonb_to_recordset(p_entries)
    as e(id text, type text, amount bigint, date date, category_id text, note text,
         created_at timestamptz, updated_at timestamptz);
end;
$$;

-- Permanent account deletion by the signed-in user. Cascades remove all their rows.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.replace_ledger(jsonb, jsonb) to authenticated;
