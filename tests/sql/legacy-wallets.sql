-- Existing players, purchases and balances BEFORE tier conversion.
insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000000001','legacy@example.invalid'),
  ('00000000-0000-4000-8000-000000000002','buyer@example.invalid');
update public.wallets set tokens = 45
where user_id = '00000000-0000-4000-8000-000000000002';
insert into public.purchases(user_id,stripe_session,pack,tokens,amount_cents,currency,payment_intent)
values ('00000000-0000-4000-8000-000000000002','legacy-purchase','pocket',15,199,'usd','legacy-payment');
