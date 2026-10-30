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
  tokens integer not null default 30 check (tokens >= 0),
  last_regen timestamptz not null default now(),
  games_played integer not null default 0,
  is_admin boolean not null default false
);
-- upgrades for projects created from an earlier version of this file
alter table public.wallets add column if not exists last_regen timestamptz not null default now();
alter table public.wallets add column if not exists is_admin boolean not null default false;
alter table public.wallets drop column if exists last_refill;
alter table public.wallets alter column tokens set default 30;

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
-- Free tokens: one comes back every 10 minutes, up to 30. Admins never spend tokens.
-- get_wallet is replaced below by a version with a different result shape, so drop it first.
drop function if exists public.get_wallet();

create or replace function public.get_wallet()
returns table (tokens integer, games_played integer, is_admin boolean, last_regen timestamptz)
language plpgsql security definer set search_path = public as $$
declare cap constant integer := 30; step constant interval := interval '10 minutes';
        w public.wallets; gained integer;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  insert into public.wallets (user_id) values (auth.uid()) on conflict do nothing;
  select * into w from public.wallets where user_id = auth.uid() for update;
  if w.tokens >= cap then
    update public.wallets set last_regen = now() where user_id = auth.uid();
  else
    gained := floor(extract(epoch from (now() - w.last_regen)) / extract(epoch from step))::integer;
    if gained > 0 then
      update public.wallets set
        tokens = least(cap, w.tokens + gained),
        last_regen = case when w.tokens + gained >= cap then now() else w.last_regen + gained * step end
      where user_id = auth.uid();
    end if;
  end if;
  return query select x.tokens, x.games_played, x.is_admin, x.last_regen from public.wallets x where x.user_id = auth.uid();
end $$;

-- Spends one token (admins: free). Returns the tokens left, or raises out_of_tokens.
create or replace function public.spend_token()
returns integer language plpgsql security definer set search_path = public as $$
declare left_now integer; admin boolean;
begin
  perform public.get_wallet();
  select x.is_admin into admin from public.wallets x where x.user_id = auth.uid();
  if admin then
    update public.wallets set games_played = games_played + 1 where user_id = auth.uid() returning tokens into left_now;
    return left_now;
  end if;
  update public.wallets set tokens = tokens - 1, games_played = games_played + 1
    where user_id = auth.uid() and tokens > 0
    returning tokens into left_now;
  if left_now is null then raise exception 'out_of_tokens'; end if;
  return left_now;
end $$;

-- Admins can give tokens to any player by email (for prizes, testers, support).
create or replace function public.grant_tokens(p_email text, p_amount integer)
returns integer language plpgsql security definer set search_path = public as $$
declare target uuid; result integer;
begin
  if not exists (select 1 from public.wallets where user_id = auth.uid() and is_admin) then raise exception 'admins_only'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 10000 then raise exception 'bad_amount'; end if;
  select id into target from auth.users where lower(email) = lower(p_email);
  if target is null then raise exception 'no_such_player'; end if;
  insert into public.wallets (user_id) values (target) on conflict do nothing;
  update public.wallets set tokens = tokens + p_amount where user_id = target returning tokens into result;
  return result;
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
revoke all on function public.grant_tokens(text, integer) from public, anon;
grant execute on function public.grant_tokens(text, integer) to authenticated;
grant execute on function public.get_wallet() to authenticated;
grant execute on function public.spend_token() to authenticated;
grant execute on function public.submit_score(text, integer) to authenticated;
grant execute on function public.top_scores(text, integer) to anon, authenticated;

-- ---------- make yourself an admin ----------
-- Sign in on the site once, then run this with your own email (do not commit your email to the repo):
--   update public.wallets set is_admin = true
--   where user_id = (select id from auth.users where lower(email) = lower('you@example.com'));
