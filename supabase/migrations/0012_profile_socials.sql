-- Social profile fields for member bios
alter table public.profiles
  add column if not exists linkedin text,
  add column if not exists instagram text,
  add column if not exists facebook text;
