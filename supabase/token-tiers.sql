-- Quarter Alley: tiered wallets (apply AFTER schema.sql, payments.sql, support.sql).
-- This file is intentionally not run automatically against a live Supabase project.
-- BACK UP the database and validate with Stripe TEST events in staging first.
-- Re-running is safe: existing split balances are never overwritten.
begin;

alter table public.wallets add column if not exists free_tokens integer;
alter table public.wallets add column if not exists bonus_tokens integer;
alter table public.wallets add column if not exists refund_debt integer not null default 0;
alter table public.wallets add column if not exists has_purchased boolean not null default false;

-- Preserve ALL legacy wallet value, including surplus earned from purchases or
-- admin gifts. Existing wallets with 30 credits become 5 free + 25 bonus.
update public.wallets
set free_tokens = coalesce(free_tokens, least(tokens, 5)),
    bonus_tokens = coalesce(bonus_tokens, greatest(0, tokens - 5))
where free_tokens is null or bonus_tokens is null;

update public.wallets w
set has_purchased = true
where not w.has_purchased
  and exists (select 1 from public.purchases p where p.user_id = w.user_id);

-- Legacy tokens remains a compatible total for existing clients. New accounts
-- now receive five free credits; purchased credits are held separately.
alter table public.wallets alter column free_tokens set default 5;
alter table public.wallets alter column bonus_tokens set default 0;
alter table public.wallets alter column free_tokens set not null;
alter table public.wallets alter column bonus_tokens set not null;
alter table public.wallets alter column tokens set default 5;
update public.wallets set tokens = free_tokens + bonus_tokens
where tokens is distinct from free_tokens + bonus_tokens;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wallets_free_tokens_range') then
    alter table public.wallets add constraint wallets_free_tokens_range
      check (free_tokens >= 0 and free_tokens <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wallets_bonus_tokens_nonnegative') then
    alter table public.wallets add constraint wallets_bonus_tokens_nonnegative check (bonus_tokens >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wallets_refund_debt_nonnegative') then
    alter table public.wallets add constraint wallets_refund_debt_nonnegative check (refund_debt >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wallets_total_matches_components') then
    alter table public.wallets add constraint wallets_total_matches_components
      check (tokens = free_tokens + bonus_tokens);
  end if;
end $$;

-- Preserve the OLD four-column get_wallet() output for any already-open browser.
-- Only the free component regenerates; purchased/gifted credits never suppress it.
create or replace function public.get_wallet()
returns table (tokens integer, games_played integer, is_admin boolean, last_regen timestamptz)
language plpgsql security definer set search_path = public as $$
declare w public.wallets;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  insert into public.wallets (user_id) values (auth.uid()) on conflict do nothing;
  select * into w from public.wallets x where x.user_id = auth.uid() for update;
  if date_trunc('week', w.last_regen at time zone 'UTC') < date_trunc('week', now() at time zone 'UTC') then
    update public.wallets x set free_tokens = 5, tokens = 5 + w.bonus_tokens,
      last_regen = now() where x.user_id = auth.uid();
  end if;
  return query
    select x.tokens, x.games_played, x.is_admin, x.last_regen
    from public.wallets x where x.user_id = auth.uid();
end $$;

-- New clients request a breakdown, but legacy clients can still call get_wallet.
create or replace function public.get_wallet_details()
returns table (tokens integer, free_tokens integer, bonus_tokens integer,
  games_played integer, is_admin boolean, has_purchased boolean,
  refund_debt integer, last_regen timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  perform public.get_wallet();
  return query
    select x.tokens, x.free_tokens, x.bonus_tokens, x.games_played,
           x.is_admin, x.has_purchased, x.refund_debt, x.last_regen
    from public.wallets x where x.user_id = auth.uid();
end $$;

-- Atomic consumption of free balance first; admins do not pay.
create or replace function public.spend_token()
returns integer language plpgsql security definer set search_path = public as $$
declare w public.wallets; remaining integer;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  perform public.get_wallet();
  select * into w from public.wallets x where x.user_id = auth.uid() for update;
  if w.is_admin then
    update public.wallets x set games_played = games_played + 1
      where x.user_id = auth.uid() returning x.tokens into remaining;
    return remaining;
  end if;
  if w.tokens <= 0 then raise exception 'out_of_tokens'; end if;
  update public.wallets x set
    free_tokens = case when w.free_tokens > 0 then w.free_tokens - 1 else w.free_tokens end,
    bonus_tokens = case when w.free_tokens = 0 then w.bonus_tokens - 1 else w.bonus_tokens end,
    tokens = w.tokens - 1,
    games_played = games_played + 1
  where x.user_id = auth.uid() returning x.tokens into remaining;
  return remaining;
end $$;

-- Admin grants are bonus credits, not free refills.
create or replace function public.grant_tokens(p_email text, p_amount integer)
returns integer language plpgsql security definer set search_path = public as $$
declare target uuid; total integer;
begin
  if not exists (select 1 from public.wallets x where x.user_id = auth.uid() and x.is_admin)
    then raise exception 'admins_only'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 10000 then raise exception 'bad_amount'; end if;
  select u.id into target from auth.users u where lower(u.email) = lower(p_email);
  if target is null then raise exception 'no_such_player'; end if;
  insert into public.wallets (user_id) values (target) on conflict do nothing;
  update public.wallets x set bonus_tokens = x.bonus_tokens + p_amount,
    tokens = x.tokens + p_amount
  where x.user_id = target returning x.tokens into total;
  return total;
end $$;

-- Webhook-only function. Replayed Checkout sessions never credit twice.
drop function if exists public.credit_purchase(uuid, text, text, integer, integer, text);
create or replace function public.credit_purchase(
  p_user uuid, p_session text, p_pack text, p_tokens integer,
  p_amount integer, p_currency text, p_payment_intent text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare inserted bigint; total integer;
begin
  if p_tokens is null or p_tokens < 1 or p_tokens > 100000 then raise exception 'bad_tokens'; end if;
  if nullif(btrim(p_session), '') is null then raise exception 'bad_session'; end if;
  insert into public.purchases
    (user_id, stripe_session, pack, tokens, amount_cents, currency, payment_intent)
  values (p_user, p_session, p_pack, p_tokens,
          coalesce(p_amount, 0), coalesce(p_currency, 'usd'), p_payment_intent)
  on conflict (stripe_session) do nothing returning id into inserted;
  if inserted is null then return null; end if;
  insert into public.wallets (user_id) values (p_user) on conflict do nothing;
  update public.wallets x set
    bonus_tokens = x.bonus_tokens + greatest(0, p_tokens - x.refund_debt),
    tokens = x.tokens + greatest(0, p_tokens - x.refund_debt),
    refund_debt = greatest(0, x.refund_debt - p_tokens),
    has_purchased = true
  where x.user_id = p_user returning x.tokens into total;
  return total;
end $$;

-- Refunds only claw back bonus credits. If already spent, record a debt to
-- offset future purchased credits, NEVER take away free refill credits.
create or replace function public.refund_purchase(p_payment_intent text, p_refunded_cents integer)
returns integer language plpgsql security definer set search_path = public as $$
declare p public.purchases; target integer; delta integer;
begin
  if p_refunded_cents is null or p_refunded_cents < 0 then raise exception 'bad_refund_amount'; end if;
  select * into p from public.purchases x where x.payment_intent = p_payment_intent for update;
  if not found then return null; end if;
  if p.amount_cents <= 0 then
    target := p.tokens;
  else
    target := least(p.tokens, ceil(p.tokens::numeric *
      least(p_refunded_cents, p.amount_cents) / p.amount_cents)::integer);
  end if;
  delta := greatest(0, target - p.refunded_tokens);
  update public.purchases x set
    refunded_cents = greatest(x.refunded_cents, p_refunded_cents),
    refunded_tokens = x.refunded_tokens + delta
  where x.id = p.id;
  if delta > 0 then
    update public.wallets x set
      tokens = x.free_tokens + greatest(0, x.bonus_tokens - delta),
      bonus_tokens = greatest(0, x.bonus_tokens - delta),
      refund_debt = x.refund_debt + greatest(0, delta - x.bonus_tokens)
    where x.user_id = p.user_id;
  end if;
  return delta;
end $$;

-- SECURITY DEFINER RPCs require explicit EXECUTE control.
revoke all on function public.get_wallet() from public, anon;
revoke all on function public.get_wallet_details() from public, anon;
revoke all on function public.spend_token() from public, anon;
revoke all on function public.grant_tokens(text, integer) from public, anon;
revoke all on function public.credit_purchase(uuid, text, text, integer, integer, text, text)
  from public, anon, authenticated;
revoke all on function public.refund_purchase(text, integer)
  from public, anon, authenticated;
grant execute on function public.get_wallet() to authenticated;
grant execute on function public.get_wallet_details() to authenticated;
grant execute on function public.spend_token() to authenticated;
grant execute on function public.grant_tokens(text, integer) to authenticated;
grant execute on function public.credit_purchase(uuid, text, text, integer, integer, text, text)
  to service_role;
grant execute on function public.refund_purchase(text, integer) to service_role;

notify pgrst, 'reload schema';
commit;
