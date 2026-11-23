-- Quarter Alley: token shop (Stripe). Run after schema.sql. Safe to re-run BEFORE token-tiers.sql; blocked afterwards.

-- Protect migrated wallets from accidental replacement by legacy RPC definitions.
do $qa_guard$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'wallets'
               and column_name = 'free_tokens') then
    raise exception 'tiered wallet migration installed: do not rerun legacy %', 'supabase/payments.sql';
  end if;
end
$qa_guard$;

-- Purchases are written only by the stripe-webhook Edge Function (service role).

create table if not exists public.purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_session text not null unique,          -- one credit per Checkout session, even if Stripe retries the webhook
  pack text not null,
  tokens integer not null check (tokens > 0),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  created_at timestamptz not null default now()
);
create index if not exists purchases_user_idx on public.purchases (user_id, created_at desc);

alter table public.purchases enable row level security;
drop policy if exists "players read their own purchases" on public.purchases;
create policy "players read their own purchases" on public.purchases for select using (auth.uid() = user_id);

-- Records a paid Checkout session and adds its tokens. Returns the new balance,
-- or null if this session was already credited.
create or replace function public.credit_purchase(p_user uuid, p_session text, p_pack text, p_tokens integer, p_amount integer, p_currency text)
returns integer language plpgsql security definer set search_path = public as $$
declare inserted bigint; result integer;
begin
  if p_tokens is null or p_tokens < 1 or p_tokens > 100000 then raise exception 'bad_tokens'; end if;
  insert into public.purchases (user_id, stripe_session, pack, tokens, amount_cents, currency)
    values (p_user, p_session, p_pack, p_tokens, coalesce(p_amount, 0), coalesce(p_currency, 'usd'))
    on conflict (stripe_session) do nothing
    returning id into inserted;
  if inserted is null then return null; end if;
  insert into public.wallets (user_id) values (p_user) on conflict do nothing;
  update public.wallets set tokens = tokens + p_tokens where user_id = p_user returning tokens into result;
  return result;
end $$;

revoke all on function public.credit_purchase(uuid, text, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.credit_purchase(uuid, text, text, integer, integer, text) to service_role;
