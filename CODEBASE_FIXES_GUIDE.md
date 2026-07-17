# Fastlytics — Codebase Issues & Implementation Guide

This document explains every problem identified in the codebase audit, why it matters, and exactly how to fix it. Each section is self-contained so it can be handed off to an implementing LLM one at a time.

**Conventions used below:**

- `file_path:line_number` references are clickable in most editors.
- "Before" / "After" code blocks show the exact change.
- Each fix lists affected files, prerequisites, and a verification step.
- Always run `npm run lint` and `npm run build` after frontend changes; run `ruff check .` and `pytest` after backend changes.

---

## Issue 1 — `QueryClient` has no default configuration

### Why it matters

`src/App.tsx:68` creates `new QueryClient()` with no options. TanStack Query's defaults are: `staleTime: 0` (refetch on every mount), `retry: 3` (aggressively retries even 4xx), `refetchOnWindowFocus: true`. For a read-heavy analytics app hitting an F1-data backend, this means:

- Every tab switch refetches all visible queries.
- Every component remount refetches data that rarely changes (historical F1 data is immutable once a session ends).
- Many individual hooks reimplement `staleTime`, `gcTime`, `retry` inconsistently, creating a patchwork of behavior.

### Files affected

- `src/App.tsx`

### How to fix

Create the `QueryClient` with sensible global defaults. Historical F1 data is effectively immutable, so a generous `staleTime` is safe for most queries. The AI/telemetry-analysis mutation is separate and unaffected.

### Step-by-step

1. Open `src/App.tsx`.
2. Replace line 68 (`const queryClient = new QueryClient();`) with a configured instance.

**Before:**

```tsx
const queryClient = new QueryClient();
```

**After:**

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Historical F1 data is immutable once a session is over.
      // 5 minutes is a safe default; individual hooks can override for
      // shorter-lived data (e.g. news feed) or longer-lived data (bios).
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
});
```

3. After this lands, you can **optionally** remove redundant `staleTime` / `gcTime` / `retry` overrides from individual hooks that now match the global default. Do this incrementally — don't mass-remove in one PR. Leave hooks that intentionally diverge (e.g. `useNews` with a shorter `staleTime`, `useAiTelemetrySummary` which is a mutation) alone.

### Verification

- Run `npm run dev`, open the app, switch browser tabs and back. Network tab should NOT show a flood of refetch requests.
- Run `npm run build` to confirm no type errors.

---

## Issue 2 — Frontend TypeScript is non-strict

### Why it matters

`tsconfig.app.json` has `strictNullChecks`, `noImplicitAny`, `noUnusedLocals`, and `noUnusedParameters` all disabled. For a data-heavy app that parses large API responses, this is the single biggest source of latent runtime bugs:

- Accessing `.foo` on a possibly-`undefined` object silently returns `undefined` instead of a compile error.
- Implicit `any` on untyped API responses means refactors won't catch breakage.
- The worker (`workers-v2`) is strict, so the two halves of the same product have different type-safety bars.

### Files affected

- `tsconfig.app.json`
- Potentially many `src/**` files that will produce new errors once strict mode is on.

### How to fix

**Do NOT flip all flags at once.** That will produce hundreds of errors and an un-mergeable PR. Instead, enable flags one at a time over several PRs, fixing errors as they surface.

### Step-by-step (phased rollout)

**Phase 1 — `noUnusedLocals` and `noUnusedParameters`:**
These are the cheapest and catch dead code.

1. Open `tsconfig.app.json`.
2. Set `"noUnusedLocals": true` and `"noUnusedParameters": true`.
3. Run `npx tsc --noEmit -p tsconfig.app.json` to list errors.
4. Fix each error by either removing the unused variable or prefixing parameter names with `_` (TS convention for intentionally unused).
5. Note: `@typescript-eslint/no-unused-vars` is disabled in ESLint; consider re-enabling it with `{ argsIgnorePattern: "^_" }` after this phase.

**Phase 2 — `noImplicitAny`:**

1. Set `"noImplicitAny": true` in `tsconfig.app.json`.
2. Run `npx tsc --noEmit`.
3. Annotate function parameters and return types that are currently implicit `any`. Focus on `src/lib/api.ts` helper functions and `src/utils/`.
4. For third-party callbacks that are genuinely untyped, use explicit `any` with an `// eslint-disable-next-line` comment.

**Phase 3 — `strictNullChecks`:**
This is the highest-value but highest-effort flag.

1. Set `"strictNullChecks": true`.
2. Run `npx tsc --noEmit`.
3. Fix errors by adding null guards (`if (data) { ... }`), optional chaining (`data?.foo`), or non-null assertions (`data!` — use sparingly, only when you can prove non-nullness).
4. Pay special attention to `Map.get()` returns (always `T | undefined`), array access, and `JSON.parse` results.
5. Update the interface definitions in `src/lib/api.ts` to mark fields that can be `null` from the backend as `| null`.

**Phase 4 — `"strict": true`:**
Once the above three are clean, flip the master `"strict": true` flag and fix any remaining diagnostics (`strictFunctionTypes`, `strictBindCallApply`, etc.).

### Verification (per phase)

- `npx tsc --noEmit -p tsconfig.app.json` must return 0 errors.
- `npm run build` must succeed.
- `npm run lint` must pass.

---

## Issue 3 — Tier season-gate can be bypassed for path-param years

### Why it matters

The `TierEnforcementMiddleware` (`backend-api/app/core/tier_middleware.py:35`) only inspects the `year` **query parameter**. But several routes encode the year in the **URL path**, e.g.:

- `/api/results/race/{year}/{event}` (in `results.py`)
- `/api/schedule/{year}` (in `schedule.py`)

These routes rely on each handler calling `enforce_season_access(year, user)` manually. If a route author forgets that dependency, free-tier users can access historical data for free. Additionally, `CURRENT_SEASON` is computed independently in both `tier.py:13` and `tier_middleware.py:11`, risking drift.

### Files affected

- `backend-api/app/core/tier_middleware.py`
- `backend-api/app/core/tier.py`
- `backend-api/app/core/config.py` (new shared constant)

### How to fix

1. Centralize `CURRENT_SEASON` in `config.py` so there's one source of truth.
2. Enhance the middleware to also extract year from path segments (for known path patterns) as a defense-in-depth fallback.
3. Audit every router to confirm it calls `enforce_season_access` or `require_user` with the year.

### Step-by-step

**Step 1 — Centralize `CURRENT_SEASON`:**

In `backend-api/app/core/config.py`, add:

```python
from datetime import datetime

def _current_season() -> int:
    year = datetime.now().year
    if datetime.now().month < 3:
        year -= 1
    return year

CURRENT_SEASON = _current_season()
```

**Step 2 — Update `tier.py` and `tier_middleware.py` to import from config:**

In `tier.py`, replace lines 13-15:

```python
# Before:
CURRENT_SEASON = datetime.now().year
if datetime.now().month < 3:
    CURRENT_SEASON -= 1

# After:
from app.core.config import CURRENT_SEASON
```

In `tier_middleware.py`, replace lines 11-13:

```python
# Before:
CURRENT_SEASON = datetime.now().year
if datetime.now().month < 3:
    CURRENT_SEASON -= 1

# After:
from app.core.config import CURRENT_SEASON
```

**Step 3 — Add path-based year extraction to the middleware:**

In `tier_middleware.py`, enhance the `dispatch` method. After the query-param check (around line 47), add path-based extraction:

```python
# If year wasn't in query params, try to extract from path
# for known patterns like /api/results/race/{year}/{event} or /api/schedule/{year}
if not year_param:
    import re
    # Match /api/schedule/{year}
    schedule_match = re.match(r'^/api/schedule/(\d{4})$', path)
    results_match = re.match(r'^/api/results/race/(\d{4})/', path)
    match = schedule_match or results_match
    if match:
        year = int(match.group(1))
        if year != CURRENT_SEASON:
            return JSONResponse(
                status_code=402,
                content={
                    "detail": f"Free tier only supports the current season ({CURRENT_SEASON}). Upgrade to Pro for historical access."
                },
            )
```

**Step 4 — Audit every router:**

Search for all route handlers that accept a year (path or query) and confirm they call `enforce_season_access(year, user)` or use `Depends(require_user)` + manual check. Specifically check:

- `app/routers/results.py` — `/api/results/race/{year}/{event}`
- `app/routers/schedule.py` — `/api/schedule/{year}`
- `app/routers/telemetry.py` — all endpoints take `year` as query param (covered by existing middleware)
- `app/routers/laps.py`
- `app/routers/strategy.py`
- `app/routers/replay.py`

For each, add either:

```python
user = require_user(request)
enforce_season_access(year, user)
```

or confirm the middleware's query-param or path-param check already covers it.

### Verification

- As a free-tier user, attempt `GET /api/results/race/2024/monaco-grand-prix?session=R`. Should return 402.
- As a free-tier user, attempt `GET /api/schedule/2024`. Should return 402.
- As a pro user, both should succeed.
- Run `pytest` and add a test case for the path-param enforcement.

---

## Issue 4 — Cached AI responses consume a credit

### Why it matters

In `backend-api/app/routers/analysis.py:654-656`, when an AI telemetry summary is found in the R2 cache, the code still calls `_log_telemetry_analysis_usage(user_context.user_id)`. This means users burn their monthly quota (5 for free, 100 for pro) on **precomputed** answers. A user could exhaust their entire free-tier quota by clicking "Explain" on charts whose analyses were already cached by another user.

### Files affected

- `backend-api/app/routers/analysis.py`

### How to fix

Do NOT log usage for cache hits. Only log usage when the LLM is actually invoked (the expensive operation).

### Step-by-step

1. Open `backend-api/app/routers/analysis.py`.
2. In the `get_telemetry_summary` endpoint (around line 650), remove the usage logging from the cache-hit branch.

**Before (lines 650-656):**

```python
cache_key = _build_cache_key(req)
cached = _r2_get_json(cache_key)
if cached is not None:
    logger.info("R2 cache hit for analysis: %s", cache_key)
    if user_context:
        _log_telemetry_analysis_usage(user_context.user_id)
    return TelemetrySummaryResponse(**cached, cached=True)
```

**After:**

```python
cache_key = _build_cache_key(req)
cached = _r2_get_json(cache_key)
if cached is not None:
    logger.info("R2 cache hit for analysis: %s", cache_key)
    # Do NOT log usage for cache hits — no LLM cost was incurred.
    return TelemetrySummaryResponse(**cached, cached=True)
```

3. The existing `_log_telemetry_analysis_usage` call after the LLM call (line 697) remains — that's correct.

### Optional enhancement

If you want to track cache-hit analytics separately (for product insights without penalizing users), add a separate lightweight counter:

```python
def _log_telemetry_cache_hit(user_id: str):
    try:
        client = get_supabase_admin()
        client.table("telemetry_analysis_cache_hits").insert({"user_id": user_id}).execute()
    except Exception:
        pass
```

And create a `telemetry_analysis_cache_hits` table in Supabase. But this is optional — the core fix is just removing the credit burn.

### Verification

- As a free user, request analysis for a chart that's already cached. Check the `telemetry_analysis_usage` table — no new row should be inserted.
- Request analysis for an uncached chart. A new row should be inserted.
- Run `pytest`.

---

## Issue 5 — In-memory `progress_store` is broken behind multiple workers

### Why it matters

`backend-api/app/services/replay_service.py:305` defines `progress_store = {}` as a module-level dict. This is an in-memory store for replay processing progress. Behind multiple Uvicorn/Gunicorn workers (standard in production), each worker has its own `progress_store`. A progress-polling request from the frontend may hit a different worker than the one processing the replay, getting an empty/stale response. This makes replay progress bars unreliable in production.

### Files affected

- `backend-api/app/services/replay_service.py`
- `backend-api/app/routers/replay.py` (if it exposes a progress endpoint)
- Optionally: `supabase/migrations/` for a new table

### How to fix

Replace the in-memory dict with a shared store. Two options:

**Option A (recommended for now): Redis** — Fast, purpose-built for this. Add a Redis client.
**Option B (no new infra): Supabase table** — Use the existing Postgres DB as a progress store. Slower but requires no new service.

### Step-by-step (Option B — Supabase, no new infra)

1. Create a migration file `supabase/migrations/20260716_create_replay_progress.sql`:

```sql
CREATE TABLE IF NOT EXISTS replay_progress (
  session_key TEXT PRIMARY KEY,  -- "{year}_{event}_{session}"
  message TEXT,
  percent REAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-expire old rows (optional, for cleanup)
CREATE INDEX IF NOT EXISTS idx_replay_progress_updated ON replay_progress(updated_at);
```

2. In `replay_service.py`, replace the `progress_store` dict and `update_progress` function:

**Before (lines 305-317):**

```python
progress_store = {}

def update_progress(key: str, message: str, percent: float = None):
    if not key: return
    current = progress_store.get(key, {})
    current['message'] = message
    if percent is not None:
        current['percent'] = percent
    progress_store[key] = current
    print(f"[Progress {key}] {message}")
```

**After:**

```python
import logging
from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

def update_progress(key: str, message: str, percent: float = None):
    """Updates replay progress in the shared Supabase store (worker-safe)."""
    if not key:
        return
    try:
        client = get_supabase_admin()
        client.table("replay_progress").upsert({
            "session_key": key,
            "message": message,
            "percent": percent if percent is not None else 0,
            "updated_at": "now()",
        }).execute()
    except Exception as e:
        logger.warning("Could not update replay progress: %s", e)
    logger.info("[Progress %s] %s", key, message)


def get_progress(key: str) -> dict | None:
    """Reads replay progress from the shared store."""
    if not key:
        return None
    try:
        client = get_supabase_admin()
        result = client.table("replay_progress").select("message, percent").eq("session_key", key).maybeSingle().execute()
        return result.data if result.data else None
    except Exception:
        return None
```

3. Update the progress-polling endpoint in `replay.py` to call `get_progress(key)` instead of reading from `progress_store`.

4. Add a cleanup mechanism — either a cron job or a Supabase function that deletes rows older than 1 hour:

```sql
-- Run periodically or as a Supabase scheduled function
DELETE FROM replay_progress WHERE updated_at < NOW() - INTERVAL '1 hour';
```

### Step-by-step (Option A — Redis, if you prefer)

1. Add `redis>=5.0` to `backend-api/requirements.txt`.
2. Add `REDIS_URL` to `.env` and `config.py`.
3. Create `backend-api/app/core/redis.py`:

```python
import os
import redis.asyncio as redis

_redis_client = None

def get_redis():
    global _redis_client
    if _redis_client is None:
        url = os.getenv("REDIS_URL")
        if url:
            _redis_client = redis.from_url(url, decode_responses=True)
    return _redis_client
```

4. Rewrite `update_progress` and add `get_progress` using `await get_redis().hset(...)` / `hgetall(...)` with a TTL of 3600 seconds.

### Verification

- Start the backend with multiple workers: `uvicorn main:app --workers 2`.
- Trigger a replay processing request on worker A, poll progress from worker B. The progress should be visible.

---

## Issue 6 — API key comparison is not constant-time

### Why it matters

`backend-api/app/core/security.py:14` uses `if key == API_KEY:` to compare the client-provided API key against the expected key. Python's `==` for strings short-circuits on the first differing byte, creating a **timing side-channel** that can leak the key byte-by-byte to an attacker with network access and precise timing measurement. This is a well-known vulnerability class (CWE-208).

### Files affected

- `backend-api/app/core/security.py`

### How to fix

Use `secrets.compare_digest()` which performs a constant-time comparison.

### Step-by-step

1. Open `backend-api/app/core/security.py`.

**Before:**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.config import API_KEY, API_KEY_NAME

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(key: str = Depends(api_key_header)):
    """Dependency to validate the API key."""
    if not API_KEY:
        return key

    if key == API_KEY:
        return key
    else:
        key_log = key[:5] if key else "None"
        print(f"Unauthorized access attempt with key: {key_log}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )
```

**After:**

```python
import hmac
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.config import API_KEY, API_KEY_NAME

logger = logging.getLogger(__name__)
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(key: str = Depends(api_key_header)):
    """Dependency to validate the API key using constant-time comparison."""
    if not API_KEY:
        return key

    if hmac.compare_digest(key, API_KEY):
        return key
    else:
        key_log = key[:5] if key else "None"
        logger.warning("Unauthorized access attempt with key: %s...", key_log)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )
```

Note: I also replaced `print()` with `logger.warning()` as a bonus (the print should ideally use structured logging everywhere — see Issue 10 for the broader effort).

### Verification

- `ruff check .` passes.
- Valid API key requests still succeed.
- Invalid API key requests still return 401.
- `pytest` passes.

---

## Issue 7 — `api.ts` is a 1,800-line god-file

### Why it matters

`src/lib/api.ts` contains ~1,800 lines mixing TypeScript interfaces, API fetch functions, a hardcoded circuit-length table, a `getHeaders` legacy helper, and utility functions like `getCircuitLength` / `calculateDistance` / `formatDistance`. This makes it hard to navigate, hard to tree-shake, and creates a single merge-conflict hotspot for any API-related work.

### Files affected

- `src/lib/api.ts` (source)
- New files to be created under `src/lib/api/` or `src/types/`
- All files that import from `@/lib/api` (verify with: `grep -rn "from '@/lib/api'" src/`)

### How to fix

Split into domain-focused modules. Keep `api.ts` as a barrel re-export for backwards compatibility so no import paths need to change immediately.

### Step-by-step

1. **Create a types directory** — `src/types/api/`:
   - `telemetry.ts` — `SpeedDataPoint`, `GearMapDataPoint`, `ThrottleDataPoint`, `BrakeDataPoint`, `RPMDataPoint`, `DRSDataPoint`, `SpeedTraceResponse`, `GearMapResponse`, `GearShiftMapData`, `TraceSamplePoint`, `PaceDistributionData`, `CompoundPaceDistribution`, `SectorStats`, `PaceDistributionResponse`
   - `strategy.ts` — `TireStint`, `DriverStrategy`, `PitStop`, `RaceControlMessage`, `TireStrategyResponse`, `StintAnalysisData`, `LapDetail`
   - `session.ts` — `SessionDriver`, `AvailableSession`, `SessionScheduleInfo`, `EventSessionSchedule`, `ScheduleEvent`
   - `standings.ts` — `DriverStanding`, `TeamStanding`, `RaceResult`, `DetailedRaceResult`, `LapPositionDataPoint`, `ChampionshipProgressionData`, `ChampionshipProgressionRound`, `ChampionshipProgressionDriver`
   - `replay.ts` — `ReplayDriverData`, `ReplayDriversMap`, `SessionReplayData`, `ReplayChunk`, `LandingReplayAvailable`, `LandingReplayMetadata`, `LandingReplayChunk`
   - `bios.ts` — `DriverDetails`, `TeamDetails`, `DriverCareer`, `DriverCareerSummary`, `DriverSeason`, `DriverBio`, `TeamCareer`, `TeamCareerSummary`, `TeamSeason`, `LeaderboardDriver`, `LeaderboardTeam`, `DriverStatEntry`, `TeamStatEntry`, `StreakEntry`, `TeamStreakEntry`, `ChampionshipProgressionResponse`, `ChampionshipRound`, `ChampionshipRival`
   - `search.ts` — `SearchResultDriver`, `SearchResultTeam`, `SearchResultArticle`, `GlobalSearchResults`
   - `team-pace.ts` — `TeamPaceSession`, `CompoundPace`, `DriverPace`, `SectorPace`, `WeatherSummary`, `TeamPaceResponse`, `TeamPaceEvent`, `TeamPaceSummary`

2. **Create fetch modules** — `src/lib/api/`:
   - `telemetry.ts` — `fetchTelemetrySpeed`, `fetchTelemetryGear`, `fetchGearShiftMap`, `fetchTelemetryThrottle`, `fetchTelemetryBrake`, `fetchTelemetryDRS`, `fetchTelemetryRPM`, `fetchPaceDistribution`
   - `strategy.ts` — `fetchTireStrategy`, `fetchStintAnalysis`
   - `laps.ts` — `fetchLapTimes`, `fetchLapGaps`, `fetchDriverLapNumbers`, `fetchLapPositions`, `fetchTrackEvolution`, `fetchSessionIncidents`
   - `session.ts` — `fetchAvailableSessions`, `fetchSessionDrivers`, `fetchEventSessionSchedule`
   - `standings.ts` — `fetchDriverStandings`, `fetchTeamStandings`, `fetchChampionshipProgression`, `fetchRaceResults`, `fetchSpecificRaceResults`
   - `schedule.ts` — `fetchSchedule`
   - `replay.ts` — `fetchSessionReplay`, `fetchSessionReplayMetadata`, `fetchSessionReplayChunk`, `fetchAvailableLandingReplays`, `fetchLandingReplayMetadata`, `fetchLandingReplayChunk`
   - `bios.ts` — `getDriverDetails`, `getTeamDetails`, `fetchDriverCareer`, `fetchDriverBio`, `fetchTeamCareer`, `fetchTeamBio`, all leaderboard fetchers
   - `team-pace.ts` — `fetchTeamPaceSummary`, `fetchTeamPaceEvent`, `fetchTeamPaceSession`
   - `compare.ts` — `fetchSectorComparison`
   - `openf1.ts` — `fetchPitStats`, `fetchPitStopsDetail`
   - `search.ts` — `fetchGlobalSearch`

3. **Create `src/lib/circuit-lengths.ts`** — Move the `CIRCUIT_LENGTHS` constant, `getCircuitLength`, `calculateDistance`, and `formatDistance` here. This data should eventually come from the backend, but for now isolate it.

4. **Make `src/lib/api.ts` a barrel re-export:**

```typescript
// Barrel re-export for backwards compatibility.
// New code should import from specific modules: @/lib/api/telemetry, etc.
export * from './api/telemetry';
export * from './api/strategy';
export * from './api/laps';
export * from './api/session';
export * from './api/standings';
export * from './api/schedule';
export * from './api/replay';
export * from './api/bios';
export * from './api/team-pace';
export * from './api/compare';
export * from './api/openf1';
export * from './api/search';
export * from '../types/api/telemetry';
// ... etc for all type modules
export { getCircuitLength, calculateDistance, formatDistance } from './circuit-lengths';
```

5. **Remove the deprecated `getHeaders` function** (lines 11-21 in `api.ts`) — it's marked as deprecated and no functions should be using it after the split. Verify with `grep -rn "getHeaders" src/`.

### Verification

- `npm run build` succeeds.
- `npm run lint` passes.
- `npm run knip` shows no new unused exports.
- All existing imports from `@/lib/api` still work (thanks to the barrel).

---

## Issue 8 — Mock data leak risk in production

### Why it matters

Two related problems:

**8a.** `fetchSectorComparison` in `src/lib/api.ts:1031-1077` returns `Math.random()` mock data gated on `process.env.NODE_ENV === 'development'`. In a Vite SPA, `process.env.NODE_ENV` is **not reliably defined** — Vite uses `import.meta.env.DEV` / `import.meta.env.MODE`. Depending on the build configuration, this check may be `undefined !== 'development'` (always false, safe) or may behave unexpectedly. Relying on it is fragile.

**8b.** There are ~21 instances of `mock`/`Math.random` across `src/` (outside tests). These should be audited to ensure none can leak into production.

### Files affected

- `src/lib/api.ts` (specifically `fetchSectorComparison`)
- Any other files found in the audit

### How to fix

**8a — Fix the environment check:**

1. Open `src/lib/api.ts`, find the `fetchSectorComparison` function (around line 1027).
2. Replace `process.env.NODE_ENV === 'development'` with `import.meta.env.DEV`.

**Before (line 1031):**

```typescript
if (process.env.NODE_ENV === 'development') {
```

**After:**

```typescript
if (import.meta.env.DEV) {
```

3. Even better, move the mock data to a separate file `src/lib/__dev__/mockSectorComparison.ts` and import it dynamically:

```typescript
if (import.meta.env.DEV) {
  const { mockSectorComparison } = await import('@/lib/__dev__/mockSectorComparison');
  return mockSectorComparison(driver1, driver2);
}
```

This ensures the mock data is tree-shaken out of production builds entirely.

**8b — Audit all mock/random usage:**

1. Run: `grep -rn "mockData\|mock\|Math.random" src/ --include="*.ts" --include="*.tsx" | grep -v "test\|__test\|private-tests"`
2. For each result, determine:
   - Is it gated behind `import.meta.env.DEV`? If yes and the gate is correct, it's safe.
   - Is it used as a placeholder/skeleton? If yes, ensure it's clearly labeled and won't appear in production (e.g. loading states).
   - Is it actual business logic? If yes, remove it and fetch real data.
3. Replace any remaining `process.env.NODE_ENV` checks with `import.meta.env.DEV`.

### Verification

- Run `npm run build` and search the output `dist/` for `Math.random` or `mockData`: `grep -rn "Math.random\|mockData" dist/`. Should return nothing (or only legitimate uses).
- Test `fetchSectorComparison` in dev mode — should return mock data.
- Test in a production preview (`npm run build && npm run preview`) — should throw an error (no mock fallback), which is the correct behavior (forces you to handle the real API being unavailable).

---

## Issue 9 — `fetchSessionIncidents` silently swallows errors

### Why it matters

`src/lib/api.ts:1100-1107` catches any error from `fetchSessionIncidents`, logs it, and returns `[]`. This hides failures from the TanStack Query layer — the query will appear as "successful" with empty data rather than "errored." The UI can't distinguish "no incidents occurred" from "the API is down." Every other endpoint in the file throws on error, which is the correct behavior for the `request()` helper.

### Files affected

- `src/lib/api.ts` (the `fetchSessionIncidents` function)
- `src/components/race/KeyMomentsHighlight.tsx` or wherever this function is consumed (check and ensure the consuming component handles error states)

### How to fix

Remove the try/catch and let the error propagate. The consuming component should handle the error state in its query hook.

### Step-by-step

1. Open `src/lib/api.ts`, find `fetchSessionIncidents` (around line 1093).

**Before:**

```typescript
export const fetchSessionIncidents = async (
  year: number,
  event: string,
  session: string
): Promise<SessionIncident[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  try {
    return await request<SessionIncident[]>(`/api/incidents?${params.toString()}`);
  } catch (error) {
    // Return empty array on error to prevent breaking UI that expects an array
    logger.error('Error fetching incidents:', error);
    return [];
    // Alternatively, throw error; if you want query hook to handle error state
  }
};
```

**After:**

```typescript
export const fetchSessionIncidents = async (
  year: number,
  event: string,
  session: string
): Promise<SessionIncident[]> => {
  const params = new URLSearchParams({ year: year.toString(), event, session });
  return request<SessionIncident[]>(`/api/incidents?${params.toString()}`);
};
```

2. Find all consumers: `grep -rn "fetchSessionIncidents" src/`
3. In each consumer's `useQuery` hook, ensure the `isError` / `error` states are handled in the UI. The pattern should be:

```typescript
const {
  data: incidents,
  isLoading,
  isError,
} = useQuery({
  queryKey: ['incidents', year, event, session],
  queryFn: () => fetchSessionIncidents(year, event, session),
});

// In render:
if (isError) {
  // Show error state or fallback, not an empty incidents list
}
```

4. If a consumer currently relies on the `[]` fallback to avoid rendering an error UI, you have two choices:
   - **Preferred:** Add a proper error state to the component.
   - **Quick fallback:** In the `useQuery` options, add `placeholderData: []` so the query starts with an empty array but still surfaces `isError: true`:

```typescript
const {
  data: incidents = [],
  isLoading,
  isError,
} = useQuery({
  queryKey: ['incidents', year, event, session],
  queryFn: () => fetchSessionIncidents(year, event, session),
  placeholderData: [],
});
```

### Verification

- Temporarily break the backend `/api/incidents` endpoint (or use an invalid session). The UI should show an error state, not silently show "no incidents."
- Restore the endpoint. The UI should show incidents normally.

---

## Issue 10 — Backend `replay_service.py` uses bare `except:` and `print()`

### Why it matters

`backend-api/app/services/replay_service.py` is 1,083 lines long and contains many instances of:

- `except:` (bare, catches everything including `KeyboardInterrupt` and `SystemExit`)
- `except Exception as e: print(f"...")` (swallows errors with unstructured console output)

Bare `except:` is a well-known anti-pattern in Python — it catches `SystemExit` and `KeyboardInterrupt`, making it impossible to cleanly stop the process. Using `print()` instead of the `logging` module means logs are unstructured, can't be filtered by level, and won't be captured by log aggregation.

### Files affected

- `backend-api/app/services/replay_service.py` (primary)
- Audit other backend files: `grep -rn "except:" backend-api/app/ --include="*.py"` and `grep -rn "print(" backend-api/app/ --include="*.py"`

### How to fix

1. Replace all bare `except:` with `except Exception:`.
2. Replace all `print(...)` with `logger.debug(...)` / `logger.info(...)` / `logger.warning(...)` / `logger.error(...)` / `logger.exception(...)` (the last one includes the traceback automatically).
3. Add a module-level logger at the top of the file.

### Step-by-step

1. Open `backend-api/app/services/replay_service.py`.
2. At the top of the file (after imports), add:

```python
import logging
logger = logging.getLogger(__name__)
```

3. Systematically go through every `print(...)` and `except:` in the file. Here's a mapping for the most common patterns:

| Pattern                                            | Replace with                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `except:`                                          | `except Exception:`                                              |
| `except Exception as e:\n    print(f"Error: {e}")` | `except Exception:\n    logger.exception("descriptive message")` |
| `print(f" -> Processing {code}")`                  | `logger.debug("Processing driver %s", code)`                     |
| `print(f" -> Error resolving event: {e}")`         | `logger.warning("Error resolving event: %s", e)`                 |
| `print(msg)`                                       | `logger.info("%s", msg)`                                         |
| `print(f"[Progress {key}] {message}")`             | `logger.info("[Progress %s] %s", key, message)`                  |

4. Specific lines to fix (non-exhaustive — do a full pass):
   - Line 35: `except:` → `except Exception:`
   - Line 57: `except Exception:` → already correct, but change `print` to `logger.exception`
   - Line 86: same pattern
   - Line 134: same pattern
   - Line 172: same pattern
   - Line 228: same pattern
   - Line 297: `print(f" -> Error resolving event: {e}")` → `logger.warning("Error resolving event: %s", e)`
   - Line 317: `print(f"[Progress {key}] {message}")` → `logger.info(...)`
   - Line 446: `print(f" -> Determined bounds...")` → `logger.debug(...)`
   - Line 460: `print(msg)` → `logger.info(...)`
   - Line 468: `print(...)` → `logger.info(...)`
   - Line 501: `print(f"Loaded F1 timing data...")` → `logger.info(...)`
   - Line 503: `print(f"Timing data not available: {e}")` → `logger.warning(...)`
   - Line 533-537: `print(f"Error generating track map: {e}")` → `logger.exception(...)`
   - Line 548: `print(f" -> Processing {code}")` → `logger.debug(...)`
   - Line 719: `print(f"Skipping driver {code} due to error: {e}")` → `logger.warning(...)`
   - Line 913: `print(f"Error extracting completed laps: {e}")` → `logger.exception(...)`
   - Line 1055: `print(f"Error building driver stints: {e}")` → `logger.exception(...)`

5. Run the same audit on other backend service files:
   ```bash
   grep -rn "except:" backend-api/app/ --include="*.py"
   grep -rn "^\s*print(" backend-api/app/ --include="*.py"
   ```
   Fix each occurrence using the same patterns.

### Verification

- `ruff check .` passes (ruff may flag bare `except:` — confirm it's clean).
- Run the backend and trigger a replay processing. Check logs — they should be structured and filterable by level.
- `pytest` passes.

---

## Issue 11 — Config drift across the project

### Why it matters

Several config files reference values that are stale or contradictory:

- `components.json` references `tailwind.config.ts` which doesn't exist (Tailwind v4 is configured in `src/index.css`). Running `npx shadcn@latest add <component>` will fail or produce incorrect output.
- Backend `.env.example` and `README.md` mention `localhost:5173`; the real dev port is **8080**.
- `wrangler.toml` declares the custom domain `dev-api.fastlytics.app`, but the frontend calls `api.fastlytics.app`. Production routing is managed outside the repo, making the checked-in config misleading.

### Files affected

- `components.json`
- `backend-api/.env.example`
- `backend-api/README.md`
- `workers-v2 (new and updated)/wrangler.toml`
- `workers-v2 (new and updated)/AGENTS.md` (already documents this — verify it's up to date)

### How to fix

**11a — Fix `components.json` for Tailwind v4:**

1. Open `components.json`.
2. The shadcn CLI for Tailwind v4 uses a different config format. Update it:

**Before (likely):**

```json
{
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  ...
}
```

**After (Tailwind v4 style — verify against the shadcn docs for your CLI version):**

```json
{
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  ...
}
```

Set `"config": ""` (empty string) to indicate there's no JS config file. The shadcn CLI for Tailwind v4 reads the CSS config directly from `src/index.css`.

3. Verify by running `npx shadcn@latest add button` (or any existing component) — it should succeed without errors.

**11b — Fix backend port references:**

1. Open `backend-api/.env.example`.
2. Change any `localhost:5173` to `localhost:8080`.
3. Open `backend-api/README.md`.
4. Same change: `localhost:5173` → `localhost:8080`.
5. Search for other occurrences: `grep -rn "5173" backend-api/ --include="*.py" --include="*.md" --include="*.env*" --include="*.txt"`

**11c — Document worker routing discrepancy:**

1. Open `workers-v2 (new and updated)/wrangler.toml`.
2. Add a comment at the top:

```toml
# NOTE: This checked-in config declares the dev custom domain.
# Production routing (api.fastlytics.app) may be managed via the
# Cloudflare dashboard or a separate deployment pipeline.
# See AGENTS.md for details.
```

3. Do NOT change the actual route unless you've confirmed production routing. The discrepancy is a deployment concern, not a code fix — but it should be documented so future contributors aren't confused.

### Verification

- `npx shadcn@latest add button` succeeds without looking for `tailwind.config.ts`.
- `grep -rn "5173" backend-api/` returns nothing.
- Read the wrangler.toml comment and confirm it accurately describes the situation.

---

## Issue 12 — Hardcoded circuit-length table in the frontend

### Why it matters

`src/lib/api.ts:837-890` contains a hardcoded `CIRCUIT_LENGTHS` dict mapping event names to circuit lengths in kilometers. This data:

- Goes stale as F1 calendar changes (new tracks, modified layouts).
- Duplicates data that the backend already has (`replay_service.py:164` computes `circuit_length_m` from telemetry).
- Lives in the frontend, which is the wrong layer for reference data.

### Files affected

- `src/lib/api.ts` (remove the table and functions)
- `src/lib/circuit-lengths.ts` (if created per Issue 7, move here temporarily)
- Backend: `backend-api/app/routers/circuit.py` or a new endpoint
- Backend: `backend-api/app/services/circuit.py` (may need a `get_circuit_length` function)

### How to fix

Expose circuit length from the backend (you already compute it for replay sessions). Then replace the frontend table with an API call or, better, include circuit length in the existing schedule/metadata responses.

### Step-by-step

**Step 1 — Backend: Add circuit length to schedule or circuit metadata.**

You already have `backend-api/app/routers/circuit.py` and `app/services/circuit.py` with `get_circuit_info_for_event`. Check if it already returns track length. If so, you may just need to expose it in the schedule endpoint.

If `get_circuit_info_for_event` returns `track_length_km`, add it to the `ScheduleEvent` response in `schedule.py`:

```python
# In schedule.py, when building the schedule response:
for event in events:
    circuit_info = get_circuit_info_for_event(year, event['EventName'])
    event['CircuitLengthKm'] = circuit_info.get('track_length_km') if circuit_info else None
```

If circuit length isn't available in `circuit.py`, add it to the circuit database/metadata. The `replay_service.py` already computes it from telemetry — you could backfill a `circuit_lengths` table by running replay processing for all known circuits.

**Step 2 — Frontend: Add `circuitLengthKm` to the `ScheduleEvent` interface.**

In the types file (after Issue 7 split, this is `src/types/api/session.ts`):

```typescript
export interface ScheduleEvent {
  RoundNumber: number;
  Country: string;
  Location: string;
  EventName: string;
  EventDate: string;
  EventFormat: string;
  Session1: string;
  Session1Date: string;
  Session2: string;
  Session2Date: string;
  Session3: string;
  Session3Date: string;
  Session4: string | null;
  Session4Date: string | null;
  Session5: string | null;
  Session5Date: string | null;
  F1ApiSupport: boolean;
  CircuitLengthKm?: number | null; // NEW
}
```

**Step 3 — Frontend: Replace `getCircuitLength` usage.**

Find all consumers: `grep -rn "getCircuitLength\|CIRCUIT_LENGTHS\|calculateDistance\|formatDistance" src/`

For each consumer, replace the hardcoded lookup with data from the schedule/circuit API response. If the data is available in the component's existing query, use it directly:

```typescript
// Before:
const circuitLength = getCircuitLength(eventName, location);
const distance = calculateDistance(laps, circuitLength);

// After:
const circuitLength = scheduleEvent?.CircuitLengthKm ?? 5.0;
const distance = laps * circuitLength;
```

**Step 4 — Remove the hardcoded table.**

Once all consumers are updated, remove `CIRCUIT_LENGTHS`, `getCircuitLength`, `calculateDistance`, and `formatDistance` from `api.ts` (or from `circuit-lengths.ts` if you created it per Issue 7).

**Fallback strategy:** If you can't immediately wire the backend data into all consumers, keep the table but move it to `src/lib/circuit-lengths.ts` (per Issue 7) as an interim step, and add a `// TODO: Replace with backend-provided circuit metadata` comment.

### Verification

- `npm run build` succeeds.
- Verify that the "distance" display on testing sessions still shows correct values.
- `grep -rn "CIRCUIT_LENGTHS" src/` returns nothing after removal.

---

## Issue 13 — Legacy/obsolete directories and duplication

### Why it matters

Several directories and files in the repo are obsolete or duplicated, increasing confusion and repository size:

- `backend-api/api/` — a backward-compatible facade that duplicates `app/`. The AGENTS.md says "prefer `app/` for current implementation work" but the old package still exists.
- `workers-old (deprecated)/` — legacy worker, explicitly deprecated.
- `.opencode/`, `.commandcode/`, `.fallow/`, `.deepsec/` — appear to be agent/tooling directories that may be obsolete.
- `users_without_profile.csv` — a one-off data file at the repo root.

### Files affected

- `backend-api/api/` (entire directory)
- `workers-old (deprecated)/` (entire directory)
- `.opencode/`, `.commandcode/`, `.fallow/`, `.deepsec/`
- `users_without_profile.csv`
- `.gitignore` (update to ignore future agent dirs if needed)

### How to fix

**13a — Audit `backend-api/api/` usage:**

1. Search for imports from the old package:
   ```bash
   grep -rn "from api\." backend-api/ --include="*.py" | grep -v "app/"
   grep -rn "import api\." backend-api/ --include="*.py" | grep -v "app/"
   ```
2. If nothing imports from `api/` anymore, it's safe to remove. If some files still import from it, migrate them to `app/` equivalents first.
3. Once confirmed unused, delete the directory: `rm -rf backend-api/api/`
4. Update `backend-api/AGENTS.md` to remove references to the `api/` package.

**13b — Remove `workers-old (deprecated)/`:**

1. Confirm nothing references it:
   ```bash
   grep -rn "workers-old" . --include="*.ts" --include="*.tsx" --include="*.py" --include="*.md" --include="*.json" | grep -v node_modules
   ```
2. Delete: `rm -rf "workers-old (deprecated)/"`
3. Update root `AGENTS.md` to remove the reference.

**13c — Audit agent/tooling directories:**

1. Check what's in each:
   ```bash
   ls -la .opencode/ .commandcode/ .fallow/ .deepsec/
   ```
2. If they contain only config/sessions that are no longer needed (the project now uses `.kilo/`), remove them.
3. If any contain important configuration, move the relevant files to `.kilo/` and remove the rest.
4. Add to `.gitignore`:
   ```
   .opencode/
   .commandcode/
   .fallow/
   .deepsec/
   ```

**13d — Remove one-off data files:**

1. Check if `users_without_profile.csv` is referenced anywhere:
   ```bash
   grep -rn "users_without_profile" . --include="*.py" --include="*.ts" --include="*.tsx" --include="*.md" | grep -v node_modules
   ```
2. If unreferenced, delete it: `rm users_without_profile.csv`

### Verification

- `npm run build` succeeds.
- `npm run knip` shows no new issues (removing unused dirs should if anything reduce issues).
- `git status` shows only the expected deletions.
- Backend `pytest` and `ruff check .` still pass.

---

## Issue 14 — Low test coverage and missing E2E suite

### Why it matters

- Frontend coverage thresholds are low: lines 40%, functions 30%, branches 25%, statements 40% (in `vitest.config.ts`). This means the majority of the app is untested.
- Tests live in `private-tests/`, not colocated with source, making them easy to forget when modifying components.
- Coverage is limited to a "curated file list" in `vitest.config.ts` — new files aren't automatically covered.
- Playwright is a devDependency but there's no E2E test suite.
- There's no global `react-error-boundary` wrapping the app — unhandled render errors crash the whole SPA (only Sentry catches them, which is reactive not preventive).

### Files affected

- `vitest.config.ts`
- `private-tests/` (existing tests)
- `src/App.tsx` (for error boundary)
- New test files to be created
- `playwright.config.ts` (new, for E2E)

### How to fix

**14a — Raise coverage thresholds incrementally:**

1. Open `vitest.config.ts`.
2. Raise thresholds in small increments. Don't jump to 80% in one go. Suggested progression:
   - Phase 1: lines 50, functions 40, branches 35, statements 50
   - Phase 2: lines 60, functions 50, branches 45, statements 60
   - Phase 3: lines 70, functions 60, branches 55, statements 70
3. After each increase, run `npm run test:coverage` to see which files fall below the new threshold.
4. Write tests for the lowest-coverage high-value files first (focus on `src/lib/api-client.ts`, `src/lib/utils.ts`, `src/contexts/AuthContext.tsx`, critical hooks).

**14b — Add a global ErrorBoundary:**

1. `react-error-boundary` is already in `package.json`. Create `src/components/common/AppErrorBoundary.tsx`:

```tsx
import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="text-white/70 max-w-md">
        An unexpected error occurred. Our team has been notified.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition-colors"
      >
        Try again
      </button>
    </div>
  );
};

const logError = (error: Error, info: React.ErrorInfo) => {
  logger.error('React render error:', error, info);
  Sentry.captureException(error, { extra: info });
};

export const AppErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={logError}
    onReset={() => window.location.reload()}
  >
    {children}
  </ErrorBoundary>
);
```

2. Wrap the app in `src/App.tsx`:

```tsx
// Before:
const App = () => (
  <MobileGate>
    <QueryClientProvider client={queryClient}>...</QueryClientProvider>
  </MobileGate>
);

// After:
const App = () => (
  <AppErrorBoundary>
    <MobileGate>
      <QueryClientProvider client={queryClient}>...</QueryClientProvider>
    </MobileGate>
  </AppErrorBoundary>
);
```

3. Import `AppErrorBoundary` at the top of `App.tsx`.

**14c — Set up a Playwright E2E suite (optional but recommended):**

1. Create `playwright.config.ts` at the project root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

2. Create `e2e/smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Fastlytics/i);
});

test('dashboard loads without crash', async ({ page }) => {
  await page.goto('/dashboard');
  // Adjust selector based on actual dashboard content
  await expect(page.locator('body')).not.toBeEmpty();
});

test('race page loads', async ({ page }) => {
  // Use a known historical race
  await page.goto('/race/2024-monaco-grand-prix');
  await expect(page.locator('body')).not.toBeEmpty();
});
```

3. Add to `package.json` scripts:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**14d — Expand unit test coverage for critical paths:**

Priority files to test (in order):

1. `src/lib/api-client.ts` — test the `request()` function: success path, error path (non-OK response), network error, abort signal.
2. `src/contexts/AuthContext.tsx` — test auth state transitions: initial load, sign in, sign out, profile fetch, subscription fetch.
3. `src/lib/utils.ts` — test utility functions.
4. `src/hooks/useReplayState.ts` — test replay timeline state management.
5. `src/lib/driverColor.ts` / `src/lib/teamColors.ts` — test color mapping.
6. `src/components/race/TireStrategy.tsx` — test rendering with mock data, focused driver toggle, view switching.

Example test for `api-client.ts`:

```typescript
// private-tests/lib/api-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request, APIError } from '@/lib/api-client';

global.fetch = vi.fn();

describe('request', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns parsed JSON on success', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });
    const result = await request('/api/test');
    expect(result).toEqual({ data: 'test' });
  });

  it('throws APIError on non-OK response', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ detail: 'Not found' }),
    });
    await expect(request('/api/test')).rejects.toThrow(APIError);
  });

  it('rethrows abort errors without wrapping', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    (fetch as any).mockRejectedValue(abortError);
    const controller = new AbortController();
    controller.abort();
    await expect(request('/api/test', { signal: controller.signal })).rejects.toThrow();
  });
});
```

### Verification

- `npm run test:coverage` passes with the new thresholds.
- Deliberately throw an error in a component (e.g. `throw new Error('test')` in a render) — the ErrorBoundary fallback should appear instead of a white screen.
- `npm run test:e2e` passes (if you set up Playwright).

---

## Summary — Priority and effort estimates

| Issue                   | Priority | Effort         | Risk if unfixed                        |
| ----------------------- | -------- | -------------- | -------------------------------------- |
| 1. QueryClient defaults | High     | Low (1 file)   | Performance, unnecessary API calls     |
| 2. Strict TypeScript    | High     | High (phased)  | Runtime bugs, refactor fragility       |
| 3. Tier gate bypass     | Critical | Medium         | Revenue loss, free access to paid data |
| 4. Cached AI credits    | Critical | Low (1 file)   | User quota exhaustion, support burden  |
| 5. progress_store       | Medium   | Medium         | Broken replay progress in prod         |
| 6. API key timing       | Medium   | Low (1 file)   | Security vulnerability (timing attack) |
| 7. api.ts split         | Medium   | Medium         | Maintainability, merge conflicts       |
| 8. Mock data leak       | Medium   | Low            | Incorrect data in production           |
| 9. Error swallowing     | Medium   | Low            | Silent failures, bad UX                |
| 10. Bare except/print   | Medium   | Medium         | Silent failures, undebuggable prod     |
| 11. Config drift        | Low      | Low            | Contributor confusion, broken tooling  |
| 12. Circuit lengths     | Low      | Medium         | Stale data, wrong distance calc        |
| 13. Legacy dirs         | Low      | Low            | Repo bloat, confusion                  |
| 14. Test coverage       | Medium   | High (ongoing) | Regressions, crashes in prod           |

### Recommended implementation order

1. **Issue 4** (cached AI credits) — 1-line fix, immediate user impact.
2. **Issue 6** (API key timing) — 1-file fix, security.
3. **Issue 1** (QueryClient defaults) — 1-file fix, performance.
4. **Issue 9** (error swallowing) — 1-function fix.
5. **Issue 8** (mock data leak) — 1-line fix.
6. **Issue 3** (tier gate bypass) — security/revenue.
7. **Issue 11** (config drift) — quick wins.
8. **Issue 10** (bare except/print) — systematic backend cleanup.
9. **Issue 5** (progress_store) — requires Supabase migration.
10. **Issue 7** (api.ts split) — large refactor, do incrementally.
11. **Issue 13** (legacy dirs) — cleanup.
12. **Issue 12** (circuit lengths) — requires backend endpoint.
13. **Issue 2** (strict TS) — phased over many PRs.
14. **Issue 14** (test coverage) — ongoing effort.
