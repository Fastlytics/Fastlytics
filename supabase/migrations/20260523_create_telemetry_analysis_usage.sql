-- Track AI telemetry analysis usage for credit-based rate limiting
-- Free tier: 5/month, Pro/Ultra: 100/month
create table if not exists public.telemetry_analysis_usage (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_telemetry_analysis_usage_user_created
  on public.telemetry_analysis_usage (user_id, created_at desc);

alter table public.telemetry_analysis_usage enable row level security;

-- Service role bypasses RLS (worker and backend use service_role key)
drop policy if exists "Service role full access" on public.telemetry_analysis_usage;
create policy "Service role full access"
  on public.telemetry_analysis_usage
  for all
  to service_role
  using (true)
  with check (true);

-- Users can read their own usage
drop policy if exists "Users read own usage" on public.telemetry_analysis_usage;
create policy "Users read own usage"
  on public.telemetry_analysis_usage
  for select
  to authenticated
  using (auth.uid() = user_id);
