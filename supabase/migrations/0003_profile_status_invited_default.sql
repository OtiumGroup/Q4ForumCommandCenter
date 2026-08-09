-- New members start as 'invited' (matching reality) rather than 'active'.
-- The app flips them to 'active' the first time they complete a real
-- login (see AppLayout in src/app/(app)/layout.tsx).

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
    'invited'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
