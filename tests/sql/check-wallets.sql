-- Assert migration invariants (run as postgres against the temporary database).
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 25 and tokens = 30 and not has_purchased
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000001'),
  'legacy 30 balance preserved as 5 free + 25 bonus');
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 40 and tokens = 45 and has_purchased
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000002'),
  'existing purchase history and larger balances preserved');
select public.qa_assert(
  not has_function_privilege('anon', 'public.get_wallet_details()', 'EXECUTE')
  and not has_function_privilege('authenticated',
    'public.credit_purchase(uuid,text,text,integer,integer,text,text)', 'EXECUTE'),
  'only authorized roles may call sensitive RPCs');

-- New account gets exactly five free credits and no purchased bonus credits.
insert into auth.users(id,email)
values ('00000000-0000-4000-8000-000000000003','new@example.invalid');
select public.qa_assert(
  (select tokens = 5 and free_tokens = 5 and bonus_tokens = 0 and not has_purchased
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  'new signed-in player starts with five');

-- A normal signed-in player spends free credits before bonus.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);
set role authenticated;
select public.spend_token();
reset role;
select public.qa_assert(
  (select free_tokens = 4 and bonus_tokens = 25 and tokens = 29
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000001'),
  'spending consumes free before purchased');
update public.wallets set last_regen = now() - interval '20 minutes'
where user_id = '00000000-0000-4000-8000-000000000001';
set role authenticated;
select * from public.get_wallet_details();
reset role;
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 25 and tokens = 30
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000001'),
  'free credits refill despite large bonus balance');

-- When free balance is zero, the next game consumes a bonus token.
update public.wallets set free_tokens = 0, tokens = bonus_tokens, last_regen = now()
where user_id = '00000000-0000-4000-8000-000000000001';
set role authenticated;
select public.spend_token();
reset role;
select public.qa_assert(
  (select free_tokens = 0 and bonus_tokens = 24 and tokens = 24
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000001'),
  'bonus is spent only after free is exhausted');

-- Admin never spends either balance and can gift bonus credits.
update public.wallets set is_admin = true
where user_id = '00000000-0000-4000-8000-000000000001';
set role authenticated;
select public.spend_token();
select public.grant_tokens('new@example.invalid', 4);
reset role;
select public.qa_assert(
  (select free_tokens = 0 and bonus_tokens = 24 and games_played = 3
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000001'),
  'admin plays without balance deduction');
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 4 and tokens = 9
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  'admin grants are bonus tokens');

-- Payment ledger retry, partial refund, insufficient balance and future offset.
set role service_role;
select public.credit_purchase('00000000-0000-4000-8000-000000000003',
  'session-1','pocket',60,600,'usd','payment-1');
select public.credit_purchase('00000000-0000-4000-8000-000000000003',
  'session-1','pocket',60,600,'usd','payment-1');
reset role;
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 64 and tokens = 69 and has_purchased
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  'purchase credited once, paid status retained');
select public.qa_assert(
  (select count(*) = 1 from public.purchases where stripe_session = 'session-1'),
  'duplicate session does not duplicate ledger');
set role service_role;
select public.refund_purchase('payment-1', 300); -- 50% => 30 tokens reversed
select public.refund_purchase('payment-1', 300); -- replay does nothing
reset role;
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 34 and tokens = 39 and refund_debt = 0
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  'partial refund idempotently reverses only bonus');
-- Simulate bonus credits spent before the remaining 50% is refunded.
update public.wallets set bonus_tokens = 2, tokens = free_tokens + 2
where user_id = '00000000-0000-4000-8000-000000000003';
set role service_role;
select public.refund_purchase('payment-1', 600); -- another 30 tokens, only 2 bonus remain
reset role;
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 0 and tokens = 5
          and refund_debt = 28 and has_purchased
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  'spent-token refund keeps free credits and records debt');
set role service_role;
select public.credit_purchase('00000000-0000-4000-8000-000000000003',
  'session-2','pocket',20,200,'usd','payment-2');
select public.credit_purchase('00000000-0000-4000-8000-000000000003',
  'session-3','pocket',10,100,'usd','payment-3');
reset role;
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 2 and tokens = 7 and refund_debt = 0
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  'future purchased credits first offset refund debt');

-- Re-running the migration cannot truncate newly separated balances.
