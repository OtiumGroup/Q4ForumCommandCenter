-- Extra structured bio fields, modeled on the forum's existing "Member
-- Bio" doc template (family / personal / business / EO sections) so the
-- in-app bio page matches what members already expect from that
-- tradition, without importing anyone's actual answers.
alter table public.profiles
  add column if not exists spouse_name text,
  add column if not exists family_notes text,
  add column if not exists hometown text,
  add column if not exists eo_member_since integer,
  add column if not exists eo_offices_held text;
