# Restore Mobile UI from Archive

## Goal

Remove the `MobileGate` "coming soon" block and restore a full mobile UI experience by porting the 28 archived components from `mobile-archive/` into the active codebase, restyling them to match the current desktop design system, and building mobile versions for the ~15 new pages that didn't exist when the archive was created.

---

## Current State

- `MobileGate` (viewport < 768px) blocks the entire app and shows a static "coming soon" page
- `mobile-archive/` has 28 complete mobile components with a "Cyber Brutalist" design (black bg, `red-600` accents, uppercase bold italic, 2px borders, monospace)
- Desktop uses a refined dark theme: `#0a0a0a` bg, Ferrari red `#ff0000` primary, subtle `border-white/[0.04]` cards, Inter font, shadcn/ui
- Desktop has ~15 pages that don't exist in the archive (Compare, Profiles, Replay, News, Leaderboards, etc.)

---

## Architecture

### Layout Strategy

Make `DashboardLayout` responsive instead of creating a parallel mobile layout:

1. **Desktop (>= 1024px)**: Existing sidebar + BreadcrumbBar + main content (unchanged)
2. **Mobile (< 1024px)**: `MobilePageHeader` (sticky top) + content + `MobileBottomNav` (fixed bottom)
3. **Landing pages**: `LandingLayout` gets a mobile-friendly header + footer

### Routing Strategy

- Keep the existing route structure in `App.tsx` unchanged
- Each route's page component internally decides whether to render a mobile or desktop version using `useIsMobile()` (from `src/hooks/use-mobile.ts`)
- Create a thin `MobilePage` wrapper that handles the mobile-specific layout chrome (header, bottom nav, scroll behavior)

### File Organization

```
src/components/mobile/
├── layout/
│   ├── MobilePageHeader.tsx      # Restored from archive, restyled
│   ├── MobileBottomNav.tsx       # Restored from archive, restyled
│   └── MobileFooter.tsx          # Restored from archive, restyled
├── pages/
│   ├── MobileDashboard.tsx       # Restored widgets from archive
│   ├── MobileCalendar.tsx        # Restored from archive
│   ├── MobileRace.tsx            # Restored from archive (largest, 1645 lines)
│   ├── MobileDriverStandings.tsx # Restored from archive
│   ├── MobileTeamStandings.tsx   # Restored from archive
│   ├── MobileAccount.tsx         # Restored from archive
│   ├── MobileCompareDrivers.tsx  # NEW - build from scratch
│   ├── MobileCompareTeams.tsx    # NEW - build from scratch
│   ├── MobileDriverProfile.tsx   # NEW
│   ├── MobileTeamProfile.tsx     # NEW
│   ├── MobileSessionReplay.tsx   # NEW
│   ├── MobileNews.tsx            # NEW
│   ├── MobileNewsArticle.tsx     # NEW
│   ├── MobileNotifications.tsx   # NEW
│   ├── MobileSaved.tsx           # NEW
│   ├── MobileSettings.tsx        # NEW
│   ├── MobileLeaderboard.tsx     # NEW (covers driver/team/pitstop leaderboards)
│   ├── MobileTeamPace.tsx        # NEW
│   ├── MobileChampionshipProgression.tsx # NEW
│   └── MobileDrivers.tsx         # NEW (driver listing)
├── race/                         # Restored from archive
│   ├── MobileStrategy.tsx
│   ├── MobileTelemetry.tsx
│   ├── MobileLapTimes.tsx
│   └── MobileHeadToHead.tsx
├── widgets/                      # Restored from archive
│   ├── MobileNextSessionCard.tsx
│   ├── MobileFavoritesWidget.tsx
│   └── MobileChampionshipWidget.tsx
└── index.ts                      # Barrel exports
```

Landing/marketing pages (restored from archive, restyled):

```
src/components/mobile/landing/
├── MobileLanding.tsx
├── MobileAuth.tsx
├── MobileOnboarding.tsx
├── MobileAbout.tsx
├── MobileContact.tsx
├── MobilePrivacyPolicy.tsx
├── MobileRefundPolicy.tsx
├── MobileTermsOfService.tsx
└── MobileNotFound.tsx
```

---

## Design System Migration

### What changes in each archived component:

| Old (Cyber Brutalist)                                   | New (Match Desktop)                                   |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `bg-black`                                              | `bg-[#0a0a0a]` or use `--background` token            |
| `border-white/10`, `border-white/20`                    | `border-white/[0.04]`, `border-white/[0.06]`          |
| `text-red-600`, `bg-red-600`                            | `text-primary`, `bg-primary` (Ferrari red `#ff0000`)  |
| `font-black uppercase italic tracking-tighter` headings | Use `.race-display` class or Inter 900 weight         |
| `font-mono` data labels                                 | `font-mono` (keep — works for data)                   |
| Custom button styles                                    | shadcn `<Button>` variants                            |
| Custom select/input styles                              | shadcn `<Select>`, `<Input>`                          |
| Custom avatar styles                                    | shadcn `<Avatar>`                                     |
| Custom toast                                            | shadcn `sonner` toast                                 |
| Hardcoded colors                                        | Use CSS custom properties from `src/index.css` @theme |

### Component replacements:

- Replace custom bottom sheet modals with shadcn `<Dialog>` or `<Sheet>`
- Replace custom dropdowns with shadcn `<Select>`
- Use existing `CARD_CONTAINER`, `CARD_LABEL`, `CARD_DATA_VALUE` tokens from `src/lib/card-styles.ts`
- Use `cn()` from `src/lib/utils` for class merging (already used in archive)

---

## Phases

### Phase 1: Foundation (unblock mobile access)

**Files to modify:**

- `src/App.tsx` — Remove `<MobileGate>` wrapper, keep everything else
- `src/components/layout/DashboardLayout.tsx` — Add responsive behavior: hide sidebar on mobile, show bottom nav, swap BreadcrumbBar for MobilePageHeader
- `src/components/layout/LandingLayout` — Add mobile header/footer for public pages

**Files to restore (from mobile-archive):**

- `MobileBottomNav.tsx` → `src/components/mobile/layout/MobileBottomNav.tsx`
- `MobilePageHeader.tsx` → `src/components/mobile/layout/MobilePageHeader.tsx`
- `MobileFooter.tsx` → `src/components/mobile/layout/MobileFooter.tsx`

**Design updates:** Restyle all three layout components to match desktop tokens.

**Outcome:** App is accessible on mobile. Users see existing desktop pages with a mobile-friendly layout shell (bottom nav + header). Pages won't be optimized for mobile yet but won't be blocked.

---

### Phase 2: Core pages (restore from archive + restyle)

Port and restyle the main data-heavy pages. Each one: restore file → fix imports → update API calls to use current `src/lib/api.ts` functions → restyle to match desktop → wire into routes.

**Priority order:**

1. `MobileDashboard.tsx` + widgets (`MobileNextSessionCard`, `MobileFavoritesWidget`, `MobileChampionshipWidget`)
2. `MobileCalendar.tsx`
3. `MobileRace.tsx` + analysis sub-pages (`MobileStrategy`, `MobileTelemetry`, `MobileLapTimes`, `MobileHeadToHead`)
4. `MobileDriverStandings.tsx` + `MobileTeamStandings.tsx`
5. `MobileAccount.tsx`

**For each file:**

- Copy from `mobile-archive/` to `src/components/mobile/pages/`
- Update all imports to current paths
- Replace old API calls with current `fetchX` functions from `src/lib/api.ts`
- Replace custom UI with shadcn components
- Update Tailwind classes to match desktop design tokens
- Wire into the corresponding route with `useIsMobile()` check

---

### Phase 3: New pages (build mobile versions)

Build mobile versions of pages that didn't exist in the archive. These share data-fetching logic with their desktop counterparts but have mobile-optimized layouts.

**Priority order:**

1. `MobileDriverProfile.tsx` + `MobileTeamProfile.tsx` — entity detail pages
2. `MobileCompareDrivers.tsx` + `MobileCompareTeams.tsx` — comparison tools
3. `MobileDrivers.tsx` — driver listing
4. `MobileLeaderboard.tsx` — parametric for driver/team/pitstop leaderboards
5. `MobileNews.tsx` + `MobileNewsArticle.tsx`
6. `MobileNotifications.tsx`
7. `MobileSaved.tsx`
8. `MobileSessionReplay.tsx`
9. `MobileSettings.tsx`
10. `MobileTeamPace.tsx`
11. `MobileChampionshipProgression.tsx`

**Pattern for each:**

- Use same `@tanstack/react-query` hooks and `src/lib/api.ts` functions as desktop
- Follow the design system from Phase 1 (shadcn components, desktop tokens)
- Responsive card layouts, touch-friendly interactions (`active:scale-[0.98]`)
- Bottom sheet modals for filters/selectors (shadcn Sheet)

---

### Phase 4: Landing & auth pages

Restore and restyle public-facing pages:

1. `MobileLanding.tsx` — marketing landing page
2. `MobileAuth.tsx` — sign in / sign up
3. `MobileOnboarding.tsx` — 4-step onboarding flow
4. `MobileAbout.tsx`, `MobileContact.tsx`
5. `MobilePrivacyPolicy.tsx`, `MobileTermsOfService.tsx`, `MobileRefundPolicy.tsx`
6. `MobileNotFound.tsx`

---

### Phase 5: Cleanup & polish

- Delete `MobileGate.tsx`, `MobileComingSoon.tsx`, `IPhoneFrame.tsx`, `AppScreenshots.tsx`, `miami-2026-data.json`
- Remove `joinMobileWaitlist` from `src/lib/app-data-api.ts`
- Add page transitions (framer-motion `AnimatePresence`)
- Test all routes on mobile viewports (375px, 390px, 414px)
- Verify all API calls work with current backend
- Performance audit (lazy loading for mobile components)

---

## Key Risks & Mitigations

| Risk                                                         | Mitigation                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Archived API calls may be outdated                           | Audit each `fetchX` import against current `src/lib/api.ts` exports before restyling |
| `MobileRace.tsx` is 1645 lines                               | Consider breaking into smaller sub-components during restoration                     |
| Two versions of each page to maintain                        | Extract shared logic into hooks; keep mobile components thin                         |
| Archive uses `framer-motion` but desktop uses `motion/react` | Update all `framer-motion` imports to `motion/react` (same lib, new package name)    |
| Some archived components use old shadcn patterns             | Update to current shadcn/ui component API                                            |

---

## Verification

After each phase:

1. `npm run build` — no TypeScript errors
2. `npm run lint` — no linting errors
3. Manual testing on Chrome DevTools mobile viewports (iPhone SE, iPhone 14, Pixel 7)
4. Verify all navigation flows work (bottom nav, back button, deep links)
5. Verify data loads correctly on all pages
6. Compare mobile page design against desktop equivalent for visual consistency

---

## Files to Delete (Phase 5)

- `src/components/mobile/MobileGate.tsx`
- `src/components/mobile/MobileComingSoon.tsx`
- `src/components/mobile/IPhoneFrame.tsx`
- `src/components/mobile/AppScreenshots.tsx`
- `src/components/mobile/miami-2026-data.json`

## Key Files to Modify

- `src/App.tsx` — Remove MobileGate wrapper
- `src/components/layout/DashboardLayout.tsx` — Responsive layout
- `src/lib/app-data-api.ts` — Remove `joinMobileWaitlist`
- Every page component in `src/pages/` — Add `useIsMobile()` conditional rendering

## Key Files to Reference (current design system)

- `src/index.css` — Design tokens (@theme)
- `src/lib/card-styles.ts` — Card styling constants
- `src/lib/navigation.ts` — Sidebar nav sections (mirror for bottom nav)
- `src/lib/utils.ts` — `cn()` utility
- `src/hooks/use-mobile.ts` — `useIsMobile()` hook
