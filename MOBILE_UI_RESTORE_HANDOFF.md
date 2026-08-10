# Mobile UI Restore — Handoff Document

## What Was Done

### Phase 1 — COMPLETE

- **Removed `MobileGate`** from `src/App.tsx` (no more "coming soon" block)
- **Created `src/hooks/use-mobile.ts`** — `useIsMobile()` hook, breakpoint at 1024px
- **Created 3 mobile layout components** in `src/components/mobile/layout/`:
  - `MobileBottomNav.tsx` — 5-tab bottom nav (Home, Calendar, Standings, News, Profile/SignIn), uses `motion/react`, `#ff0000` active indicator, matches desktop design tokens
  - `MobilePageHeader.tsx` — sticky header with centered `FastlyticsLogo`, optional back button
  - `MobileFooter.tsx` — footer with logo + links
  - `index.ts` — barrel export
- **Updated `src/components/layout/DashboardLayout.tsx`** — now responsive:
  - `useIsMobile()` controls which layout renders
  - Desktop (>= 1024px): sidebar + BreadcrumbBar (unchanged)
  - Mobile (< 1024px): hamburger menu + breadcrumbs header + `MobileBottomNav` at bottom, `pb-20` on content

### Phase 2 — COMPLETE

All archived race/standings/calendar/account pages restored, restyled, and wired:

1. `MobileCalendar.tsx` → wired into `src/pages/Calendar.tsx`
2. `MobileDriverStandings.tsx` → wired into `src/pages/DriverStandings.tsx`
3. `MobileTeamStandings.tsx` → wired into `src/pages/TeamStandings.tsx`
4. `MobileAccount.tsx` → wired into `src/pages/Settings.tsx`
5. `MobileRace.tsx` → wired into `src/pages/Race.tsx` (renders `<MobileRace />` on mobile; reads `raceId` from `useParams()` internally)
6. Race sub-components in `src/components/mobile/race/`: `MobileStrategy`, `MobileTelemetry`, `MobileLapTimes`, `MobileHeadToHead` + `index.ts` barrel

### Phase 3 — PARTIALLY COMPLETE

**Completed pages (built from scratch, matching desktop design system):**

| Mobile component               | Wired into                                                          | Notes                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `MobileNews.tsx`               | `src/pages/News.tsx`                                                | ✅                                                                                                                            |
| `MobileNotifications.tsx`      | `src/pages/Notifications.tsx`                                       | ✅                                                                                                                            |
| `MobileProfile.tsx`            | `src/pages/Profile.tsx`                                             | ✅                                                                                                                            |
| `MobileSaved.tsx`              | `src/pages/Saved.tsx`                                               | ✅ full folders/charts CRUD, bottom sheets, bulk actions                                                                      |
| `MobilePitstopLeaderboard.tsx` | `src/pages/PitstopLeaderboard.tsx`                                  | ✅ filters, year selector                                                                                                     |
| `MobileLeaderboard.tsx`        | `src/pages/DriverLeaderboard.tsx` + `src/pages/TeamLeaderboard.tsx` | ✅ parametric `kind="drivers" \| "teams"`, all 13 driver + 18 team stats, search/nationality/sort, same query keys as desktop |

**Helper:** `src/components/mobile/pages/tireicon.tsx` (shared tire icon for race components).

**Barrel export** `src/components/mobile/pages/index.ts` includes: MobileCalendar, MobileDriverStandings, MobileTeamStandings, MobileAccount, MobileRace, MobileNews, MobileNotifications, MobileProfile, MobileSaved, MobilePitstopLeaderboard, MobileLeaderboard.

### How the wiring works

Each desktop page uses this pattern to render mobile vs desktop:

```tsx
import { useIsMobile } from '@/hooks/use-mobile';
import MobileXxx from '@/components/mobile/pages/MobileXxx';

const PageName = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileXxx />;
  return <PageNameDesktop />;
};

const PageNameDesktop = () => {
  // ... original desktop code unchanged
};
```

**Pages currently wired (12):** Calendar, DriverStandings, TeamStandings, Settings, Race, News, Notifications, Profile, Saved, PitstopLeaderboard, DriverLeaderboard, TeamLeaderboard.

---

## What Remains

### Phase 3 (rest)

Desktop pages still needing mobile versions (build from scratch, same design system):

| #   | Mobile component to build           | Wire into                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `MobileDrivers.tsx`                 | `src/pages/Drivers.tsx` — active grid (DriverStanding cards w/ team color strip + headshot), leaderboard tables, Legends section. Desktop grid is already 1-col on mobile; port the 3 table components + LEGENDS.                                                                                                                                                                                                                                                                                                                     |
| 2   | `MobileDriverProfile.tsx`           | `src/pages/DriverProfile.tsx` — `fetchDriverCareer`/`fetchDriverBio`, tabs overview/championship/teammates. Season table → stacked rows.                                                                                                                                                                                                                                                                                                                                                                                              |
| 3   | `MobileTeamProfile.tsx`             | `src/pages/TeamProfile.tsx` — `fetchTeamCareer`/`fetchTeamBio`, tabs overview/championship.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | `MobileCompareDrivers.tsx`          | `src/pages/CompareDrivers.tsx` — **NOTE: desktop is a "Coming soon" stub. No `fetchHeadToHead` API exists.** Design from scratch: pick 2-3 via bottom-sheet picker (`fetchGlobalSearch` or standings), compare `fetchDriverCareer` season arrays client-side.                                                                                                                                                                                                                                                                         |
| 5   | `MobileCompareTeams.tsx`            | `src/pages/CompareTeams.tsx` — same situation; compare `fetchTeamCareer` data.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6   | `MobileNewsDiscussion.tsx`          | `src/pages/NewsDiscussion.tsx` — uses `@/hooks/useDiscussion` (`useDiscussion`, `useArticleVote`, `usePostComment`, `useDeleteComment`, `useCommentVote`). Desktop is already narrow single-column; add tap affordances for delete/reply.                                                                                                                                                                                                                                                                                             |
| 7   | `MobileChampionshipProgression.tsx` | `src/pages/ChampionshipProgression.tsx` — `fetchChampionshipProgression(year)`; chart needs responsive height on mobile; driver picker → bottom sheet.                                                                                                                                                                                                                                                                                                                                                                                |
| 8   | `MobileTeamPace.tsx`                | `src/pages/TeamPaceAnalysis.tsx` — `fetchTeamPaceSummary`/`fetchTeamPaceEvent`; can reuse reducer + `src/pages/team-pace-analysis/utils.ts`; charts need mobile sizing.                                                                                                                                                                                                                                                                                                                                                               |
| 9   | `MobileDashboard.tsx`               | `src/pages/Dashboard.tsx` — **NO archive MobileDashboard exists; must compose.** Archive widgets ARE portable: `mobile-archive/MobileNextSessionCard.tsx`, `MobileFavoritesWidget.tsx`, `MobileChampionshipWidget.tsx`, `MobileRecentRaces.tsx` (swap `framer-motion` → `motion/react`). Reuse desktop query keys (`['schedule', year]`, `['driverStandings', year]`, `['teamStandings', year]`, `['raceResults', year]`) + `useFavoritesWidgetData` hook + `nextSession`/`recentRaces` memo logic in Dashboard.tsx (lines ~179-276). |
| 10  | `MobileSessionReplay.tsx`           | `src/pages/SessionReplayPage.tsx` — **HARDEST: replay engine is mouse-only (`onMouseDown/Move/Up`), widgets render only in `isFullscreen`, leaderboard hidden below `md`.** Options: reuse internal hooks (`useReplayState`, `useChunkLoader`, `useReplayData`) with a touch-aware layout, or render desktop `SessionReplay` as-is since it's already fullscreen overlay.                                                                                                                                                             |

### Phase 4 — Landing & auth pages (restore from `mobile-archive/` + restyle)

1. `MobileLanding.tsx`
2. `MobileAuth.tsx`
3. `MobileOnboarding.tsx`
4. `MobileAbout.tsx`
5. `MobileContact.tsx`
6. `MobilePrivacyPolicy.tsx`
7. `MobileTermsOfService.tsx`
8. `MobileRefundPolicy.tsx`
9. `MobileNotFound.tsx`

These don't need `DashboardLayout` wrapping (they use `LandingLayout`), so the mobile check should be inside each page component.

### Phase 5 — Cleanup

- Delete `src/components/mobile/MobileGate.tsx`
- Delete `src/components/mobile/MobileComingSoon.tsx`
- Delete `src/components/mobile/IPhoneFrame.tsx`
- Delete `src/components/mobile/AppScreenshots.tsx`
- Delete `src/components/mobile/miami-2026-data.json`
- Remove `joinMobileWaitlist` from `src/lib/app-data-api.ts`
- Run `npm run build` and `npm run lint` to verify
- Test on mobile viewports (375px, 390px, 414px)

---

## Design System Reference

All mobile components use these tokens (matching desktop):

| Old (archive)                                | New (desktop match)                 |
| -------------------------------------------- | ----------------------------------- |
| `bg-black`                                   | `bg-[#0a0a0a]`                      |
| `border-2 border-white/10`                   | `border border-white/[0.04]`        |
| `border-2 border-white/20`                   | `border border-white/[0.06]`        |
| `border-2 border-white/5`                    | `border border-white/[0.02]`        |
| `bg-red-600` / `border-red-600`              | `bg-[#ff0000]` / `border-[#ff0000]` |
| `text-red-600` / `text-red-500`              | `text-[#ff0000]`                    |
| `text-gray-500`                              | `text-white/40`                     |
| `text-gray-400`                              | `text-white/50`                     |
| `text-gray-300`                              | `text-white/80`                     |
| `text-gray-600`                              | `text-white/25`                     |
| `text-gray-700`                              | `text-white/15`                     |
| `bg-zinc-900`                                | `bg-white/[0.03]`                   |
| `bg-zinc-900/50`                             | `bg-white/[0.02]`                   |
| `hover:bg-zinc-900`                          | `hover:bg-white/[0.04]`             |
| `font-black uppercase italic tracking-tight` | `font-semibold`                     |
| `rounded-xl`                                 | `rounded-lg`                        |
| `rounded-t-3xl`                              | `rounded-t-2xl`                     |
| `from 'framer-motion'`                       | `from 'motion/react'`               |

**Preserved as-is:**

- `font-mono` for data values
- `active:scale-[0.98]` touch feedback
- `bg-f1-${teamColor}` team color classes
- `bg-yellow-600` championship gold
- `cn()` from `@/lib/utils`
- All `@/lib/api` imports
- All `@tanstack/react-query` hooks (keep the SAME query keys as desktop so caches are shared)

**Mobile page conventions (from completed pages):**

- Each page starts with a sticky centered `FastlyticsLogo` header (`border-b border-white/[0.04] bg-[#0a0a0a]/95 backdrop-blur-sm`)
- Page title row below: `text-[18px] font-semibold tracking-[-0.01em]`, subtitle `text-[12px] text-white/40`
- Cards: `rounded-lg border border-white/[0.04]`, rows `active:scale-[0.98]`
- Bottom sheets for filters/selectors: `rounded-t-2xl`, drag-handle bar, `Cancel01Icon` close (see `MobileSaved.tsx` BottomSheet)
- Mobile pages do NOT wrap in `MobileLayout` or `MobilePageHeader` — parent `DashboardLayout` handles bottom nav/header

---

## Key Files

| File                                        | Purpose                                                   |
| ------------------------------------------- | --------------------------------------------------------- |
| `src/App.tsx`                               | Routes, MobileGate removed                                |
| `src/hooks/use-mobile.ts`                   | `useIsMobile()` hook (1024px breakpoint)                  |
| `src/components/layout/DashboardLayout.tsx` | Responsive layout (sidebar vs bottom nav)                 |
| `src/components/mobile/layout/`             | MobileBottomNav, MobilePageHeader, MobileFooter           |
| `src/components/mobile/pages/`              | Mobile page components (barrel: `index.ts`)               |
| `src/components/mobile/race/`               | Race analysis sub-components (barrel: `index.ts`)         |
| `mobile-archive/`                           | Original archived files (source of truth for restoration) |
| `src/lib/card-styles.ts`                    | Desktop card design tokens                                |
| `src/index.css`                             | Desktop @theme design tokens                              |

## Key Data APIs (verified against `src/lib/api.ts`)

- Leaderboards: `fetchDriver*Leaderboard` / `fetchTeam*Leaderboard` (13 driver / 18 team variants, `FETCH_LIMIT = 500`), types `LeaderboardDriver`, `DriverStatEntry`, `StreakEntry`, `LeaderboardTeam`, `TeamStatEntry`, `TeamStreakEntry`
- Profiles: `fetchDriverCareer(slug)` → `DriverCareer` (+`fetchDriverBio`), `fetchTeamCareer(slug)` → `TeamCareer` (+`fetchTeamBio`; bio reuses `DriverBio` type)
- Progression: `fetchChampionshipProgression(year)` → `ChampionshipProgressionData` `{ rounds, drivers: { [code]: { name, team, points_history } } }`
- Team pace: `fetchTeamPaceSummary(year)`, `fetchTeamPaceEvent(year, eventSlug)`
- Discussion (separate lib): `@/hooks/useDiscussion` wraps `@/lib/discussion-api` (`fetchDiscussion`, votes, comments)
- Replay: `fetchSessionReplayMetadata` + hooks `useChunkLoader`, `useReplayState`, `useReplayData` in `@/components/replay/SessionReplay.tsx`
- Helpers: `getDriverImage(code, year)`, `getDriverImagesByCode(code)`, `getTeamLogo(name)`, `getTeamSlug(name)`, `getTeamColorClass(name)` (`bg-f1-${cls}`), `getNationalityCountryCode` (flagcdn), `getCurrentSeasonYear`
- NO `fetchHeadToHead` exists — compare pages must compare career data client-side

---

## Build Status

As of last check: **`npx tsc --noEmit` passes cleanly.** Run `npx tsc --noEmit` and `npx vite build` to verify after any changes.
