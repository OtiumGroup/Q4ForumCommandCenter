-- Lets a freshly-invited user mark their own invite record accepted once
-- they've verified their invite link and are authenticated. Runs as
-- SECURITY DEFINER because the invites table is otherwise admin-only,
-- and is scoped tightly: it can only touch a 'pending' row matching the
-- caller's own verified email, and only to flip it to 'accepted'.

create or replace function public.mark_invite_accepted()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text;
begin
  select email into caller_email from auth.users where id = auth.uid();
  if caller_email is null then
    return;
  end if;
  update public.invites
  set status = 'accepted', accepted_at = now()
  where email = caller_email and status = 'pending';
end;
$$;

revoke all on function public.mark_invite_accepted() from public, anon;
grant execute on function public.mark_invite_accepted() to authenticated;
