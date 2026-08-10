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

### Phase 2 — PARTIALLY COMPLETE

**Completed pages (restored from `mobile-archive/`, restyled to match desktop):**

1. **`src/components/mobile/pages/MobileCalendar.tsx`** — COMPLETE, wired into `src/pages/Calendar.tsx`
2. **`src/components/mobile/pages/MobileDriverStandings.tsx`** — COMPLETE, wired into `src/pages/DriverStandings.tsx`
3. **`src/components/mobile/pages/MobileTeamStandings.tsx`** — COMPLETE, wired into `src/pages/TeamStandings.tsx`
4. **`src/components/mobile/pages/MobileAccount.tsx`** — COMPLETE, wired into `src/pages/Settings.tsx`
5. **`src/components/mobile/pages/index.ts`** — barrel export (needs updating when more pages are added)

**All 5 Race files — COMPLETE (created by background agent):**

6. **`src/components/mobile/pages/MobileRace.tsx`** — restored from `mobile-archive/MobileRace.tsx`, design tokens updated
7. **`src/components/mobile/race/MobileStrategy.tsx`** — restored from `mobile-archive/MobileStrategy.tsx`
8. **`src/components/mobile/race/MobileTelemetry.tsx`** — restored from `mobile-archive/MobileTelemetry.tsx`
9. **`src/components/mobile/race/MobileLapTimes.tsx`** — restored from `mobile-archive/MobileLapTimes.tsx`
10. **`src/components/mobile/race/MobileHeadToHead.tsx`** — restored from `mobile-archive/MobileHeadToHead.tsx`

**Only remaining Phase 2 work:** Wire `MobileRace` into `src/pages/Race.tsx` (add `useIsMobile()` check).

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

**Pages already wired:**

- `src/pages/Calendar.tsx` → `MobileCalendar`
- `src/pages/DriverStandings.tsx` → `MobileDriverStandings`
- `src/pages/TeamStandings.tsx` → `MobileTeamStandings`
- `src/pages/Settings.tsx` → `MobileAccount`

**Pages still needing wiring:**

- `src/pages/Race.tsx` → needs `MobileRace` (once the file is confirmed/created)

---

## What Remains

### Phase 2 (finish Race)

- All 5 MobileRace files are created and restyled
- Wire `MobileRace` into `src/pages/Race.tsx` — add `useIsMobile()` check at top of the `Race` component (line 63), render `<MobileRace />` on mobile (it reads `raceId` from `useParams()` internally)
- Add `MobileRace` to `src/components/mobile/pages/index.ts` barrel export
- Add race sub-components to a new `src/components/mobile/race/index.ts` barrel export
- Run `npx tsc --noEmit` and `npx vite build` to verify

### Phase 3 — New pages (build from scratch)

These desktop pages don't have archived mobile versions. Build mobile versions using the same design system:

1. `MobileDriverProfile.tsx` → wire into `src/pages/DriverProfile.tsx`
2. `MobileTeamProfile.tsx` → wire into `src/pages/TeamProfile.tsx`
3. `MobileCompareDrivers.tsx` → wire into `src/pages/CompareDrivers.tsx`
4. `MobileCompareTeams.tsx` → wire into `src/pages/CompareTeams.tsx`
5. `MobileDrivers.tsx` → wire into `src/pages/Drivers.tsx`
6. `MobileLeaderboard.tsx` → wire into `src/pages/DriverLeaderboard.tsx`, `TeamLeaderboard.tsx`, `PitstopLeaderboard.tsx`
7. `MobileNews.tsx` → wire into `src/pages/News.tsx`
8. `MobileNewsDiscussion.tsx` → wire into `src/pages/NewsDiscussion.tsx`
9. `MobileNotifications.tsx` → wire into `src/pages/Notifications.tsx`
10. `MobileSaved.tsx` → wire into `src/pages/Saved.tsx`
11. `MobileSessionReplay.tsx` → wire into `src/pages/SessionReplayPage.tsx`
12. `MobileTeamPace.tsx` → wire into `src/pages/TeamPaceAnalysis.tsx`
13. `MobileChampionshipProgression.tsx` → wire into `src/pages/ChampionshipProgression.tsx`
14. `MobileProfile.tsx` → wire into `src/pages/Profile.tsx`
15. `MobileDashboard.tsx` → wire into `src/pages/Dashboard.tsx`

### Phase 4 — Landing & auth pages

Restore from `mobile-archive/` and restyle:

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
- All `@tanstack/react-query` hooks

**Mobile pages do NOT wrap in `MobileLayout` or `MobilePageHeader`** — the parent `DashboardLayout` handles bottom nav and header. Each mobile page starts with a sticky `FastlyticsLogo` header.

---

## Key Files

| File                                        | Purpose                                                   |
| ------------------------------------------- | --------------------------------------------------------- |
| `src/App.tsx`                               | Routes, MobileGate removed                                |
| `src/hooks/use-mobile.ts`                   | `useIsMobile()` hook (1024px breakpoint)                  |
| `src/components/layout/DashboardLayout.tsx` | Responsive layout (sidebar vs bottom nav)                 |
| `src/components/mobile/layout/`             | MobileBottomNav, MobilePageHeader, MobileFooter           |
| `src/components/mobile/pages/`              | Mobile page components                                    |
| `src/components/mobile/race/`               | Race analysis sub-components                              |
| `mobile-archive/`                           | Original archived files (source of truth for restoration) |
| `src/lib/card-styles.ts`                    | Desktop card design tokens                                |
| `src/index.css`                             | Desktop @theme design tokens                              |

---

## Build Status

As of last check: **TypeScript and Vite build both pass cleanly.** Run `npx tsc --noEmit` and `npx vite build` to verify after any changes.
