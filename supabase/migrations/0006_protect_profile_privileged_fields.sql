-- The "members can update their own profile" RLS policy is row-level,
-- not column-level: as written it would let any member PATCH their own
-- role to 'admin' or their own status to whatever they like. Close that
-- with a trigger that only admins can bypass, carving out one narrow
-- self-service exception: invited -> active on first real login.

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only admins can change a member''s role.';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Email is managed automatically.';
  end if;

  if new.status is distinct from old.status then
    if not (old.status = 'invited' and new.status = 'active') then
      raise exception 'Only admins can change a member''s status.';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_profile_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();
