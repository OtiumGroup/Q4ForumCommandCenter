insert into public.document_categories (name, sort_order) values
  ('Family', 1),
  ('Marriage', 2),
  ('Kids', 3),
  ('Forum Exercises', 4),
  ('Self-Help', 5),
  ('Business', 6),
  ('Finance', 7),
  ('Health', 8),
  ('Other', 9)
on conflict (name) do nothing;
