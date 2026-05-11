create or replace function public.get_user_id_by_email(email_address text)
returns uuid
language plpgsql
security definer
as $$
declare
  found_user_id uuid;
begin
  select id into found_user_id
  from auth.users
  where email = email_address
  limit 1;
  
  return found_user_id;
end;
$$;
