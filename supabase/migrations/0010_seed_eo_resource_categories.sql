-- Matches the 8 top-level sections of the forum's "BOOK-Moderator
-- Resources" Drive folder (see the project's eo-drive-repo-index.md).
insert into public.eo_resource_categories (name, sort_order) values
  ('Overview', 1),
  ('5%', 2),
  ('Deep Dive', 3),
  ('Forum Activities', 4),
  ('Constitution', 5),
  ('Retreat', 6),
  ('Forum Resources', 7),
  ('EO Programs & Resources', 8)
on conflict (name) do nothing;
