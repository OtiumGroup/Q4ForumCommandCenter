-- Add email to profiles so admins/members can see a directory without
-- needing service-role access to auth.users (which isn't exposed via
-- the REST API at all). Kept in sync at signup time by handle_new_user().

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce((new.raw_user_meta_data->>'role')::public.member_role, 'member'),
    'active'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Backfill for any profiles created before this column existed.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
