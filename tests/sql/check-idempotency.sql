-- Run AFTER re-applying token-tiers.sql to prove idempotence.
select public.qa_assert(
  (select free_tokens = 5 and bonus_tokens = 2 and tokens = 7 and
          refund_debt = 0 and has_purchased
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000003'),
  're-running the migration never resets a paid wallet');
select public.qa_assert(
  (select free_tokens = 0 and bonus_tokens = 24 and tokens = 24 and is_admin
   from public.wallets where user_id = '00000000-0000-4000-8000-000000000001'),
  're-running the migration preserves admin and bonus state');
select public.qa_assert(
  (select count(*) = 4 from public.purchases),
  're-running the migration preserves the purchase ledger');
