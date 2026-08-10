-- Shared member photo gallery
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;

create policy "Members view gallery" on public.gallery_photos for select to authenticated using (true);
create policy "Members add gallery photos" on public.gallery_photos for insert to authenticated with check (uploader_id = auth.uid());
create policy "Members delete own gallery photos" on public.gallery_photos for delete to authenticated using (uploader_id = auth.uid() or is_admin());

insert into storage.buckets (id, name, public) values ('gallery','gallery',true) on conflict (id) do nothing;
create policy "Gallery images publicly readable" on storage.objects for select using (bucket_id = 'gallery');
create policy "Members upload gallery" on storage.objects for insert to authenticated with check (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Members delete own gallery" on storage.objects for delete to authenticated using (bucket_id = 'gallery' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
