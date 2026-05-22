-- Add privacy columns to profiles table
alter table public.profiles
  add column if not exists is_public boolean not null default true,
  add column if not exists show_favorites boolean not null default true,
  add column if not exists show_comments boolean not null default true,
  add column if not exists show_saved_charts boolean not null default true;

-- Enable RLS on profiles table (idempotent)
alter table public.profiles enable row level security;

-- Allow authenticated users to read all profiles (so logged-in users can view any profile)
drop policy if exists "Allow authenticated read access" on public.profiles;
create policy "Allow authenticated read access"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Allow public (anonymous) read access to profiles — needed for profile pages to be
-- viewable by anyone, including incognito/not-logged-in visitors.
-- Privacy filtering is handled at the application layer (Profile.tsx).
drop policy if exists "Allow public read access" on public.profiles;
create policy "Allow public read access"
  on public.profiles
  for select
  to anon
  using (true);

-- Only allow users to update their own profile row
drop policy if exists "Allow individual user update" on public.profiles;
create policy "Allow individual user update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only allow users to delete their own profile row
drop policy if exists "Allow individual user delete" on public.profiles;
create policy "Allow individual user delete"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- Allow the handle_new_auth_user_profile trigger to insert (it runs with security definer)
drop policy if exists "Allow trigger insert" on public.profiles;
create policy "Allow trigger insert"
  on public.profiles
  for insert
  to authenticated, anon
  with check (true);
