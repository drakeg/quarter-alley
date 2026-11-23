-- Ephemeral Postgres-only Supabase auth fixture. NEVER run this on a live project.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated, anon, service_role;
grant execute on function auth.uid() to authenticated, anon, service_role;
create function public.qa_assert(ok boolean, message text)
returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'wallet test failed: %', message; end if;
end $$;
