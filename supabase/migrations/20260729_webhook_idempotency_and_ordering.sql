-- Make Dodo Payments webhook processing idempotent and order-independent.
--
-- Dodo retries failed deliveries up to 8 times with exponential backoff and
-- explicitly does not guarantee that events arrive in the order they were
-- emitted (https://docs.dodopayments.com/developer-resources/webhooks).
-- The previous handler upserted on user_id with no record of which events it
-- had already processed, so a retried or delayed event could overwrite newer
-- subscription state -- for example a late subscription.active reviving a
-- cancelled subscription and restoring paid access indefinitely.
--
-- Two mechanisms are introduced:
--
--   1. webhook_events -- a ledger keyed on the webhook-id header, which Dodo
--      keeps stable across retries of the same event. Inserting it is the
--      first write in the transaction, so concurrent retries collide on the
--      primary key instead of both proceeding.
--
--   2. subscriptions.last_event_at -- a per-subscription watermark. An event
--      older than the watermark is discarded rather than applied.

create table if not exists public.webhook_events (
  webhook_id text primary key,
  event_type text not null,
  subscription_id text,
  user_id uuid,
  event_timestamp timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists idx_webhook_events_received_at
  on public.webhook_events (received_at desc);

alter table public.webhook_events enable row level security;

-- The ledger is written only by the backend; no client role gets access.
drop policy if exists "Service role manages webhook events" on public.webhook_events;
create policy "Service role manages webhook events"
  on public.webhook_events
  for all
  to service_role
  using (true)
  with check (true);

-- RLS already returns nothing to client roles, but revoking the grant also
-- keeps the table out of the exposed REST/GraphQL schema so payment event
-- metadata is not discoverable.
revoke all on table public.webhook_events from anon, authenticated;

alter table public.subscriptions
  add column if not exists last_event_at timestamptz;

-- Dodo reports six subscription states (pending, active, on_hold, cancelled,
-- failed, expired). The original constraint allowed only four, so a
-- subscription that entered 'pending' or 'failed' could not be recorded.
alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending', 'active', 'on_hold', 'cancelled', 'failed', 'expired'));


-- Applies one webhook event to subscription state in a single transaction.
--
-- Returns:
--   'duplicate' -- this webhook-id was processed before; caller should 200 and stop
--   'stale'     -- the event is older than the state already stored; discarded
--   'applied'   -- state was updated
--
-- A null p_plan / p_status / p_billing_interval / p_current_period_end means
-- the event carries no opinion on that field, so the stored value is kept.
-- This is what stops an event type the handler does not map from silently
-- resetting plan to 'free'.
create or replace function public.apply_subscription_event(
  p_webhook_id text,
  p_event_type text,
  p_event_timestamp timestamptz,
  p_user_id uuid,
  p_subscription_id text,
  p_plan text,
  p_status text,
  p_billing_interval text,
  p_current_period_end timestamptz
) returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_existing public.subscriptions;
  v_event_at timestamptz := coalesce(p_event_timestamp, now());
  v_plan text;
  v_status text;
  v_interval text;
  v_period_end timestamptz;
  v_entitled boolean;
begin
  insert into public.webhook_events (
    webhook_id, event_type, subscription_id, user_id, event_timestamp
  ) values (
    p_webhook_id, p_event_type, p_subscription_id, p_user_id, v_event_at
  )
  on conflict (webhook_id) do nothing;

  -- Nothing inserted means another delivery of this same event already ran.
  if not found then
    return 'duplicate';
  end if;

  select * into v_existing
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if found
     and v_existing.last_event_at is not null
     and v_event_at < v_existing.last_event_at then
    return 'stale';
  end if;

  v_plan       := coalesce(p_plan, v_existing.plan, 'free');
  v_status     := coalesce(p_status, v_existing.status, 'active');
  v_interval   := coalesce(p_billing_interval, v_existing.billing_interval);
  v_period_end := coalesce(p_current_period_end, v_existing.current_period_end);

  insert into public.subscriptions as s (
    user_id, dodo_subscription_id, plan, status,
    billing_interval, current_period_end, last_event_at, updated_at
  ) values (
    p_user_id, p_subscription_id, v_plan, v_status,
    v_interval, v_period_end, v_event_at, now()
  )
  on conflict (user_id) do update set
    dodo_subscription_id = coalesce(excluded.dodo_subscription_id, s.dodo_subscription_id),
    plan                 = excluded.plan,
    status               = excluded.status,
    billing_interval     = excluded.billing_interval,
    current_period_end   = excluded.current_period_end,
    last_event_at        = excluded.last_event_at,
    updated_at           = excluded.updated_at
  where s.last_event_at is null
     or s.last_event_at <= excluded.last_event_at;

  -- The row existed but the guard above rejected the write. This covers the
  -- case where two events for a new subscription race past the FOR UPDATE
  -- check, since that check locks nothing when no row exists yet.
  if not found then
    return 'stale';
  end if;

  -- A cancelled subscription keeps access until the period already paid for
  -- ends. Dodo's default cancellation takes effect at the next billing date,
  -- so revoking immediately on subscription.cancelled cuts off a paying
  -- customer early.
  v_entitled := v_status = 'active'
                or (v_status = 'cancelled'
                    and v_period_end is not null
                    and v_period_end > now());

  update public.profiles
  set subscription_tier = case when v_entitled then v_plan else 'free' end
  where id = p_user_id;

  return 'applied';
end;
$$;

revoke all on function public.apply_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.apply_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, timestamptz
) to service_role;
