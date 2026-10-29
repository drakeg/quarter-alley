-- Quarter Alley: accounts, server-side tokens and scores.
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: it creates what is missing and replaces the functions.

-- ---------- tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text unique check (char_length(display_name) between 2 and 20),
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tokens integer not null default 10 check (tokens >= 0),
  last_refill date not null default current_date,
  games_played integer not null default 0
);

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game text not null check (game ~ '^[a-z0-9-]{2,40}$'),
  score integer not null check (score > 0 and score < 100000000),
  created_at timestamptz not null default now()
);
create index if not exists scores_game_score_idx on public.scores (game, score desc);
create index if not exists scores_user_idx on public.scores (user_id, game);

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.scores enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles for select using (true);
drop policy if exists "players edit their own profile" on public.profiles;
create policy "players edit their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "players read their own wallet" on public.wallets;
create policy "players read their own wallet" on public.wallets for select using (auth.uid() = user_id);
-- No insert/update policies on wallets: balances only change through the functions below.

drop policy if exists "players read their own scores" on public.scores;
create policy "players read their own scores" on public.scores for select using (auth.uid() = user_id);
-- Scores are written through submit_score() and read publicly through top_scores().

-- ---------- new players get a profile and a wallet ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; candidate text; n int := 0;
begin
  base := left(regexp_replace(coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'player'), '[^A-Za-z0-9 _-]', '', 'g'), 16);
  if char_length(base) < 2 then base := 'player'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where display_name = candidate) loop
    n := n + 1; candidate := left(base, 16) || n::text;
  end loop;
  insert into public.profiles (id, display_name) values (new.id, candidate) on conflict do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- wallet functions ----------
-- Returns the player's wallet, topping it back up to 10 once per day.
create or replace function public.get_wallet()
returns setof public.wallets language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  insert into public.wallets (user_id) values (auth.uid()) on conflict do nothing;
  update public.wallets set tokens = greatest(tokens, 10), last_refill = current_date
    where user_id = auth.uid() and last_refill < current_date;
  return query select * from public.wallets where user_id = auth.uid();
end $$;

-- Spends one token. Returns the tokens left, or raises out_of_tokens.
create or replace function public.spend_token()
returns integer language plpgsql security definer set search_path = public as $$
declare left_now integer;
begin
  perform public.get_wallet();
  update public.wallets set tokens = tokens - 1, games_played = games_played + 1
    where user_id = auth.uid() and tokens > 0
    returning tokens into left_now;
  if left_now is null then raise exception 'out_of_tokens'; end if;
  return left_now;
end $$;

-- ---------- score functions ----------
create or replace function public.submit_score(p_game text, p_score integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  -- simple flood guard: at most 30 scores per player per hour
  if (select count(*) from public.scores where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'slow_down';
  end if;
  insert into public.scores (user_id, game, score) values (auth.uid(), p_game, p_score);
end $$;

-- Best score per player for one game.
create or replace function public.top_scores(p_game text, p_limit integer default 10)
returns table (display_name text, score integer, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select p.display_name, b.score, b.created_at
  from (
    select distinct on (s.user_id) s.user_id, s.score, s.created_at
    from public.scores s where s.game = p_game
    order by s.user_id, s.score desc, s.created_at asc
  ) b
  join public.profiles p on p.id = b.user_id
  order by b.score desc, b.created_at asc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ---------- permissions ----------
revoke all on function public.get_wallet() from public, anon;
revoke all on function public.spend_token() from public, anon;
revoke all on function public.submit_score(text, integer) from public, anon;
grant execute on function public.get_wallet() to authenticated;
grant execute on function public.spend_token() to authenticated;
grant execute on function public.submit_score(text, integer) to authenticated;
grant execute on function public.top_scores(text, integer) to anon, authenticated;
