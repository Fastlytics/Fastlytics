-- =============================================================================
-- ANALYTICS CENTRALIZATION MIGRATION
-- Transforms user_activity into a proper analytics warehouse table
-- =============================================================================

-- 1. Make user_id nullable to support anonymous user tracking
ALTER TABLE user_activity ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add session_id for tracking anonymous sessions across page loads
ALTER TABLE user_activity ADD COLUMN session_id text;

-- 3. Backfill session_id for existing rows using user_id
UPDATE user_activity SET session_id = user_id::text WHERE session_id IS NULL;

-- 4. Performance indexes for common analytical queries
CREATE INDEX IF NOT EXISTS idx_ua_event_name ON user_activity(event_name);
CREATE INDEX IF NOT EXISTS idx_ua_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ua_user_id ON user_activity(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ua_session_id ON user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_ua_event_created ON user_activity(event_name, created_at DESC);

-- GIN index for JSONB event_data queries
CREATE INDEX IF NOT EXISTS idx_ua_event_data ON user_activity USING gin(event_data jsonb_path_ops);

-- Expression indexes for frequently queried JSONB fields
CREATE INDEX IF NOT EXISTS idx_ua_page_path ON user_activity((event_data->>'page_path'));
CREATE INDEX IF NOT EXISTS idx_ua_is_mobile ON user_activity(((event_data->>'is_mobile')::boolean));

-- 5. RLS: Allow anonymous inserts (session_id required, user_id NULL)
CREATE POLICY "Allow anonymous activity tracking"
  ON user_activity
  FOR INSERT
  WITH CHECK (
    user_id IS NULL AND session_id IS NOT NULL
  );

-- =============================================================================
-- ANALYTICS VIEWS — Queryable from Supabase Dashboard / SQL Editor
-- =============================================================================

-- VIEW: Top pages by visit count (last 30 days)
CREATE OR REPLACE VIEW analytics_top_pages AS
SELECT
  event_data->>'page_path' AS page_path,
  COUNT(*) AS total_views,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(AVG((event_data->>'screen_width')::numeric)) AS avg_screen_width,
  DATE_TRUNC('day', created_at) AS day
FROM user_activity
WHERE event_name = 'page_viewed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'page_path', DATE_TRUNC('day', created_at)
ORDER BY total_views DESC;

-- VIEW: Top selections (driver picks, team picks, lap choices — last 30 days)
CREATE OR REPLACE VIEW analytics_top_selections AS
SELECT
  event_data->>'selector' AS selector_name,
  event_data->>'selected_value' AS selected_value,
  COUNT(*) AS selection_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  DATE_TRUNC('day', created_at) AS day
FROM user_activity
WHERE event_name = 'selection_changed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'selector', event_data->>'selected_value', DATE_TRUNC('day', created_at)
ORDER BY selection_count DESC;

-- VIEW: Chart engagement — which charts users spend the most time on
CREATE OR REPLACE VIEW analytics_chart_engagement AS
SELECT
  event_data->>'chart_name' AS chart_name,
  event_data->>'page' AS page,
  COUNT(*) AS view_count,
  ROUND(AVG((event_data->>'view_duration_seconds')::numeric), 1) AS avg_dwell_seconds,
  ROUND(MAX((event_data->>'view_duration_seconds')::numeric), 1) AS max_dwell_seconds,
  ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (event_data->>'view_duration_seconds')::numeric))::numeric, 1) AS median_dwell_seconds,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM user_activity
WHERE event_name = 'chart_viewed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'chart_name', event_data->>'page'
ORDER BY avg_dwell_seconds DESC;

-- VIEW: User interactions — toggles, filters, buttons
CREATE OR REPLACE VIEW analytics_interactions AS
SELECT
  event_data->>'interaction' AS interaction_name,
  event_data->>'page_path' AS page_path,
  COUNT(*) AS interaction_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  DATE_TRUNC('day', created_at) AS day
FROM user_activity
WHERE event_name = 'user_interaction'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'interaction', event_data->>'page_path', DATE_TRUNC('day', created_at)
ORDER BY interaction_count DESC;

-- VIEW: Access time patterns — when users visit the site
CREATE OR REPLACE VIEW analytics_access_patterns AS
SELECT
  event_data->>'local_hour' AS hour_of_day,
  event_data->>'local_day' AS day_of_week,
  COUNT(*) AS event_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) AS unique_users
FROM user_activity
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND event_data->>'local_hour' IS NOT NULL
GROUP BY event_data->>'local_hour', event_data->>'local_day'
ORDER BY event_count DESC;

-- VIEW: Time on page — which pages hold attention
CREATE OR REPLACE VIEW analytics_time_on_page AS
SELECT
  event_data->>'page' AS page_path,
  COUNT(*) AS sample_count,
  ROUND(AVG((event_data->>'seconds')::numeric), 1) AS avg_seconds,
  ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (event_data->>'seconds')::numeric))::numeric, 1) AS median_seconds,
  ROUND(MAX((event_data->>'seconds')::numeric), 1) AS max_seconds
FROM user_activity
WHERE event_name = 'time_on_page'
  AND (event_data->>'seconds')::numeric > 0
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'page'
ORDER BY avg_seconds DESC;

-- VIEW: Device breakdown
CREATE OR REPLACE VIEW analytics_device_breakdown AS
SELECT
  CASE WHEN (event_data->>'is_mobile')::boolean THEN 'mobile' ELSE 'desktop' END AS device_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  DATE_TRUNC('day', created_at) AS day
FROM user_activity
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY (event_data->>'is_mobile')::boolean, DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- VIEW: Onboarding preferences — favorite drivers and teams selected
CREATE OR REPLACE VIEW analytics_onboarding_preferences AS
SELECT
  event_data->>'selector' AS selector_type,
  event_data->>'selected_value' AS selection,
  COUNT(*) AS times_selected,
  COUNT(DISTINCT user_id) AS unique_users
FROM user_activity
WHERE event_name = 'selection_changed'
  AND event_data->>'selector' IN ('onboarding_driver', 'onboarding_team')
GROUP BY event_data->>'selector', event_data->>'selected_value'
ORDER BY times_selected DESC;

-- VIEW: Daily event volume — overall platform activity (90 days)
CREATE OR REPLACE VIEW analytics_daily_volume AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS logged_in_users,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS anonymous_events
FROM user_activity
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), event_name
ORDER BY day DESC, event_count DESC;

-- VIEW: Session activity — sessions per day, events per session (90 days)
CREATE OR REPLACE VIEW analytics_session_activity AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS authenticated_sessions,
  COUNT(DISTINCT session_id) FILTER (WHERE user_id IS NULL) AS anonymous_sessions,
  COUNT(*) AS total_events,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT session_id), 0), 1) AS events_per_session
FROM user_activity
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- =============================================================================
-- DATA RETENTION: Function to clean up old analytics data
-- Call via: SELECT analytics_cleanup(180) to keep last 180 days
-- =============================================================================
CREATE OR REPLACE FUNCTION analytics_cleanup(retention_days integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM user_activity
  WHERE created_at < NOW() - (retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
