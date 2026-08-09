-- EO Q4 Forum Command Center — initial schema
-- Security model: every table has RLS enabled from creation. Members can
-- read most shared forum content (that's the point of the app), but writes
-- are scoped to the owning member or restricted to admins.

create extension if not exists "pgcrypto";

-- ============================================================
-- ROLES & PROFILES
-- ============================================================

create type public.member_role as enum ('admin', 'member');
create type public.member_status as enum ('invited', 'active', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  status public.member_status not null default 'invited',

  -- Mandatory onboarding fields
  full_name text,
  birthday date,
  photo_url text,

  -- Optional bio fields
  home_address text,
  phone_home text,
  phone_cell text,
  websites text[] default '{}',
  sport_played text,
  current_interests text,
  education text,
  kids jsonb not null default '[]',        -- [{ "name": "...", "age": ... }]
  businesses jsonb not null default '[]',  -- [{ "name","address","website","google_link" }]
  bio_notes text,

  email_notifications boolean not null default true,
  in_app_notifications boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Members can view all active profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Members can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Helper used throughout: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- INVITES
-- ============================================================

create type public.invite_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  role public.member_role not null default 'member',
  status public.invite_status not null default 'pending',
  invited_by uuid references public.profiles(id),
  personal_note text,
  language text default 'en',
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.invites enable row level security;

create policy "Admins manage invites"
  on public.invites for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- BROADCASTS (admin communications to all members)
-- ============================================================

create table public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.broadcasts enable row level security;

create policy "Members can read broadcasts"
  on public.broadcasts for select
  to authenticated
  using (true);

create policy "Admins can write broadcasts"
  on public.broadcasts for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can delete broadcasts"
  on public.broadcasts for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- MEETINGS (forum meeting schedule)
-- ============================================================

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Forum Meeting',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "Members can read meetings"
  on public.meetings for select
  to authenticated
  using (true);

create policy "Admins manage meetings"
  on public.meetings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- EVENTS (EO events + member-created events) + RSVPs
-- ============================================================

create type public.event_source as enum ('eo', 'member');
create type public.rsvp_status as enum ('attending', 'interested', 'not_attending');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  source public.event_source not null default 'member',
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  address text,
  link text,
  created_by uuid references public.profiles(id),
  notify_forum boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Members can read events"
  on public.events for select
  to authenticated
  using (true);

create policy "Members can create events"
  on public.events for insert
  to authenticated
  with check (created_by = auth.uid() or public.is_admin());

create policy "Owners and admins can update events"
  on public.events for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "Owners and admins can delete events"
  on public.events for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  status public.rsvp_status not null,
  updated_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

alter table public.event_rsvps enable row level security;

create policy "Members can read all rsvps"
  on public.event_rsvps for select
  to authenticated
  using (true);

create policy "Members manage their own rsvp"
  on public.event_rsvps for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update their own rsvp"
  on public.event_rsvps for update
  to authenticated
  using (member_id = auth.uid());

create policy "Members delete their own rsvp"
  on public.event_rsvps for delete
  to authenticated
  using (member_id = auth.uid());

-- ============================================================
-- DOCUMENTS LIBRARY (member-uploaded, categorized, searchable)
-- ============================================================

create table public.document_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

alter table public.document_categories enable row level security;

create policy "Members can read categories"
  on public.document_categories for select
  to authenticated
  using (true);

create policy "Admins manage categories"
  on public.document_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.document_categories(id),
  file_path text not null,       -- storage path in the "documents" bucket
  file_type text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Members can read documents"
  on public.documents for select
  to authenticated
  using (true);

create policy "Members can upload documents"
  on public.documents for insert
  to authenticated
  with check (uploaded_by = auth.uid());

create policy "Owners and admins can delete documents"
  on public.documents for delete
  to authenticated
  using (uploaded_by = auth.uid() or public.is_admin());

create table public.resource_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  category_id uuid references public.document_categories(id),
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.resource_links enable row level security;

create policy "Members can read resource links"
  on public.resource_links for select
  to authenticated
  using (true);

create policy "Members can add resource links"
  on public.resource_links for insert
  to authenticated
  with check (added_by = auth.uid());

create policy "Owners and admins can delete resource links"
  on public.resource_links for delete
  to authenticated
  using (added_by = auth.uid() or public.is_admin());

-- ============================================================
-- BOOKS / AUDIOBOOKS / PODCASTS
-- ============================================================

create type public.media_type as enum ('book', 'audiobook', 'podcast');

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  type public.media_type not null,
  title text not null,
  author_or_host text,
  topic text,                     -- business, health, family, kids, etc.
  cover_image_url text,
  source_url text,                -- original pasted link
  external_link text,             -- e.g. Audible search link, podcast link
  description text,
  added_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.media_items enable row level security;

create policy "Members can read media items"
  on public.media_items for select
  to authenticated
  using (true);

create policy "Members can add media items"
  on public.media_items for insert
  to authenticated
  with check (added_by = auth.uid());

create policy "Owners and admins can delete media items"
  on public.media_items for delete
  to authenticated
  using (added_by = auth.uid() or public.is_admin());

-- ============================================================
-- CONSTITUTION (single read-only document, admin-managed)
-- ============================================================

create table public.constitution (
  id int primary key default 1,
  file_path text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  constraint constitution_singleton check (id = 1)
);

alter table public.constitution enable row level security;

create policy "Members can read the constitution"
  on public.constitution for select
  to authenticated
  using (true);

create policy "Admins manage the constitution"
  on public.constitution for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- GOALS / ACCOUNTABILITY
-- ============================================================

create type public.goal_area as enum ('business', 'personal', 'life');
create type public.goal_status as enum ('not_started', 'on_track', 'at_risk', 'done');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  area public.goal_area not null,
  title text not null,
  details text,
  due_date date,
  status public.goal_status not null default 'not_started',
  needs_help boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

-- Visible to the whole forum on purpose — the point is group accountability.
create policy "Members can read all goals"
  on public.goals for select
  to authenticated
  using (true);

create policy "Members manage their own goals"
  on public.goals for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "Members update their own goals"
  on public.goals for update
  to authenticated
  using (member_id = auth.uid() or public.is_admin());

create policy "Members delete their own goals"
  on public.goals for delete
  to authenticated
  using (member_id = auth.uid() or public.is_admin());

-- ============================================================
-- EO RESOURCES LIBRARY (digitized Moderator BOOK, admin-managed, read-only)
-- ============================================================

create table public.eo_resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,      -- e.g. "Overview", "5%", "Deep Dive", ...
  sort_order int not null default 0
);

alter table public.eo_resource_categories enable row level security;

create policy "Members can read EO resource categories"
  on public.eo_resource_categories for select
  to authenticated
  using (true);

create policy "Admins manage EO resource categories"
  on public.eo_resource_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.eo_resources (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.eo_resource_categories(id),
  title text not null,
  file_path text not null,        -- storage path in the "eo-resources" bucket
  file_type text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.eo_resources enable row level security;

create policy "Members can read EO resources"
  on public.eo_resources for select
  to authenticated
  using (true);

create policy "Admins manage EO resources"
  on public.eo_resources for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- updated_at triggers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

-- ============================================================
-- New-user bootstrap: create a profiles row whenever someone
-- accepts an invite and a Supabase auth user is created.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce((new.raw_user_meta_data->>'role')::public.member_role, 'member'),
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
