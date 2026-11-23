-- Quarter Alley: refunds and the contact inbox. Run after payments.sql. Safe to re-run BEFORE token-tiers.sql; blocked afterwards.

-- Protect migrated wallets from accidental replacement by legacy RPC definitions.
do $qa_guard$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'wallets'
               and column_name = 'free_tokens') then
    raise exception 'tiered wallet migration installed: do not rerun legacy %', 'supabase/support.sql';
  end if;
end
$qa_guard$;


-- Refunds: link each purchase to its Stripe payment so a refund can find it.
alter table public.purchases add column if not exists payment_intent text;
alter table public.purchases add column if not exists refunded_cents integer not null default 0;
alter table public.purchases add column if not exists refunded_tokens integer not null default 0;
create index if not exists purchases_payment_intent_idx on public.purchases (payment_intent);

-- credit_purchase now also stores the payment_intent (7th argument).
drop function if exists public.credit_purchase(uuid, text, text, integer, integer, text);
create or replace function public.credit_purchase(p_user uuid, p_session text, p_pack text, p_tokens integer, p_amount integer, p_currency text, p_payment_intent text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare inserted bigint; result integer;
begin
  if p_tokens is null or p_tokens < 1 or p_tokens > 100000 then raise exception 'bad_tokens'; end if;
  insert into public.purchases (user_id, stripe_session, pack, tokens, amount_cents, currency, payment_intent)
    values (p_user, p_session, p_pack, p_tokens, coalesce(p_amount, 0), coalesce(p_currency, 'usd'), p_payment_intent)
    on conflict (stripe_session) do nothing
    returning id into inserted;
  if inserted is null then return null; end if;
  insert into public.wallets (user_id) values (p_user) on conflict do nothing;
  update public.wallets set tokens = tokens + p_tokens where user_id = p_user returning tokens into result;
  return result;
end $$;
revoke all on function public.credit_purchase(uuid, text, text, integer, integer, text, text) from public, anon, authenticated;
grant execute on function public.credit_purchase(uuid, text, text, integer, integer, text, text) to service_role;

-- Removes tokens in proportion to the total amount refunded so far. Stripe sends the running
-- total, so replays and partial refunds settle to the right number. Returns tokens removed now.
create or replace function public.refund_purchase(p_payment_intent text, p_refunded_cents integer)
returns integer language plpgsql security definer set search_path = public as $$
declare p public.purchases; target integer; delta integer;
begin
  select * into p from public.purchases where payment_intent = p_payment_intent for update;
  if not found then return null; end if;
  if p.amount_cents <= 0 then target := p.tokens;
  else target := least(p.tokens, ceil(p.tokens::numeric * least(p_refunded_cents, p.amount_cents) / p.amount_cents)::integer);
  end if;
  delta := greatest(0, target - p.refunded_tokens);
  update public.purchases set refunded_cents = greatest(refunded_cents, p_refunded_cents), refunded_tokens = refunded_tokens + delta where id = p.id;
  if delta > 0 then
    update public.wallets set tokens = greatest(0, tokens - delta) where user_id = p.user_id;
  end if;
  return delta;
end $$;
revoke all on function public.refund_purchase(text, integer) from public, anon, authenticated;
grant execute on function public.refund_purchase(text, integer) to service_role;

-- Contact inbox. Anyone can send; nobody can read except the owner in the Supabase dashboard.
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 5 and 200),
  topic text not null check (topic in ('general', 'purchase', 'account', 'business', 'bug', 'other')),
  body text not null check (char_length(body) between 10 and 4000),
  page text check (char_length(page) <= 300),
  handled boolean not null default false
);
alter table public.messages enable row level security;
create index if not exists messages_created_idx on public.messages (created_at desc);

create or replace function public.send_message(p_name text, p_email text, p_topic text, p_body text, p_page text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  p_name := btrim(coalesce(p_name, '')); p_email := lower(btrim(coalesce(p_email, ''))); p_body := btrim(coalesce(p_body, ''));
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email'; end if;
  if char_length(p_body) < 10 then raise exception 'too_short'; end if;
  if (select count(*) from public.messages where email = p_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.messages where created_at > now() - interval '1 hour') >= 60 then
    raise exception 'slow_down';
  end if;
  insert into public.messages (user_id, name, email, topic, body, page)
    values (auth.uid(), left(p_name, 80), left(p_email, 200), p_topic, left(p_body, 4000), left(p_page, 300));
end $$;
revoke all on function public.send_message(text, text, text, text, text) from public;
grant execute on function public.send_message(text, text, text, text, text) to anon, authenticated;
