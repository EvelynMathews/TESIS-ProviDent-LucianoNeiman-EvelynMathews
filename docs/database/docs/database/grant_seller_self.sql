-- grant_seller_self.sql
-- Self-service SELLER grant

create or replace function public.grant_seller_self()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.user_roles(user_id, role)
  values (auth.uid(), 'SELLER')
  on conflict do nothing;

  insert into public.user_sellers(user_id)
  values (auth.uid())
  on conflict do nothing;
end
$fn$;
