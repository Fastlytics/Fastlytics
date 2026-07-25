-- Enable RLS on all tables accessed from the browser bundle.
-- The bundle exposes table names to attackers; RLS ensures knowing the
-- names grants no access beyond what each user is authorized to read/write.

-- subscriptions
alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages subscriptions" on public.subscriptions;
create policy "Service role manages subscriptions"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- saved_folders
alter table public.saved_folders enable row level security;

drop policy if exists "Users manage own folders" on public.saved_folders;
create policy "Users manage own folders"
  on public.saved_folders
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manages folders" on public.saved_folders;
create policy "Service role manages folders"
  on public.saved_folders
  for all
  to service_role
  using (true)
  with check (true);

-- saved_charts
alter table public.saved_charts enable row level security;

drop policy if exists "Users manage own charts" on public.saved_charts;
create policy "Users manage own charts"
  on public.saved_charts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public read public charts" on public.saved_charts;
create policy "Public read public charts"
  on public.saved_charts
  for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "Service role manages charts" on public.saved_charts;
create policy "Service role manages charts"
  on public.saved_charts
  for all
  to service_role
  using (true)
  with check (true);

-- comments
alter table public.comments enable row level security;

drop policy if exists "Users manage own comments" on public.comments;
create policy "Users manage own comments"
  on public.comments
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public read non-deleted comments" on public.comments;
create policy "Public read non-deleted comments"
  on public.comments
  for select
  to anon, authenticated
  using (deleted = false);

drop policy if exists "Service role manages comments" on public.comments;
create policy "Service role manages comments"
  on public.comments
  for all
  to service_role
  using (true)
  with check (true);

-- f1_teams (public reference data)
alter table public.f1_teams enable row level security;

drop policy if exists "Public read teams" on public.f1_teams;
create policy "Public read teams"
  on public.f1_teams
  for select
  to anon, authenticated
  using (true);

-- news_articles (public reference data)
alter table public.news_articles enable row level security;

drop policy if exists "Public read news" on public.news_articles;
create policy "Public read news"
  on public.news_articles
  for select
  to anon, authenticated
  using (true);

-- replay_progress (service_role only — no client access)
alter table public.replay_progress enable row level security;

drop policy if exists "Service role access replay progress" on public.replay_progress;
create policy "Service role access replay progress"
  on public.replay_progress
  for all
  to service_role
  using (true)
  with check (true);
