-- One invite record per email — re-inviting the same address updates
-- the existing row instead of creating duplicates.
alter table public.invites add constraint invites_email_key unique (email);
