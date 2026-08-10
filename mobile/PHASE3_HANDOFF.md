# Phase 3 Mobile Redesign — Handoff Notes

Native `@expo/ui` (Material You / SwiftUI) + Liquid Glass (iOS) + Victory Native charts,
replacing the web-styled RN Views in `mobile/`. No physical device/simulator available —
validation is `tsc --noEmit`, `npm run lint`, and Metro web smoke tests via
`npx expo start --web` + curl (no Chrome/Chromium available for Playwright visual checks
either — confirmed via `mcp_playwright_browser_navigate` failing with "Chromium
distribution not found" and no cached browser under `~/Library/Caches/ms-playwright`).

## Progress: 12/13 tasks

- [x] 1. Inspected `@expo/ui@57.0.8` API, audited theme/colors.ts and screen structure
- [x] 2. Installed deps: expo-glass-effect, expo-blur, victory-native@41.26.0,
      @shopify/react-native-skia@2.6.2, react-native-reanimated@4.5.1,
      react-native-gesture-handler@2.32.0, react-native-worklets@0.10.1
- [x] 3. Rebuilt `theme/colors.ts` with Color API (Material You dynamic on Android,
      semantic UIKit colors on iOS)
- [x] 4-8. Redesigned Home, Calendar, Standings, Drivers, Teams, Account, News screens
      with `@expo/ui` primitives (List/ListItem/Button/Switch/Icon etc.)
- [x] 9. Added iOS Liquid Glass via `mobile/src/components/AdaptiveGlass.tsx` (GlassView
      when `isLiquidGlassAvailable()`, else `expo-blur` BlurView fallback — required, the
      non-iOS `GlassView` is a no-op `<View>`)
- [x] 10. Redesigned race hub chrome (`race/[slug].tsx`) + `OverviewTab.tsx`
- [x] 11. Victory Native charts — DONE, tsc/lint/Metro smoke test all clean (see below)
- [x] 12. Redesign Head-to-Head tab (`components/race/HeadToHeadTab.tsx`) — DONE, see below
- [ ] 13. Final full lint/tsc/diff validation + summarize the whole Phase 3 redesign

## Environment note (found this phase)

`node_modules` did not exist anywhere in the repo at the start of this phase (root or
`mobile/`) despite `bun.lockb` + `package-lock.json` being present — dependencies had
never been installed in this sandbox. Ran `npm install` from repo root (npm workspaces:
`packages/shared` + `mobile`) to unblock `tsc`/`lint`/Metro. 1152 packages installed
cleanly, no errors.

## Bug found and fixed this phase: `mobile/metro.config.js`

`config.resolver.disableHierarchicalLookup = true` was set (comment claimed it was for
symlink resolution — it is not related to symlinks, that's a different Metro resolver
concern). This flag disables Metro's normal upward directory-tree walk through
`node_modules`, which is exactly the mechanism needed to resolve **nested** deps like
`react-native-reanimated/node_modules/semver` (reanimated bundles its own semver 7.8.5
because the hoisted root one is 6.3.1). Once `victory-native` pulled `react-native-reanimated`
into the web bundle (task 11), Metro's web bundling failed outright with
`Unable to resolve "semver/functions/satisfies"` — a full bundling failure, not a warning,
meaning the web smoke test would never have passed with this flag on. Disabled the flag
(commented out with an explanation, not deleted, in case there's a symlink-related reason
it was added that isn't documented anywhere — `packages/shared` is symlinked into
`node_modules/@fastlytics/shared` and resolved fine without the flag in testing, so it's
very likely safe to remove entirely, but leaving the historical line commented rather than
silently deleting it). This fix was required to get the Metro smoke test to pass at all,
so it directly unblocks tasks 11 and 12 validation.

## Task 11 — Victory Native charts (done, re-verified this phase)

- `mobile/src/components/race/TelemetryTab.tsx` — manual `View`-height-percentage bar
  approximation replaced with real `victory-native` `CartesianChart` + `Area` (gradient
  fill via `@shopify/react-native-skia` `LinearGradient`) + `Line`. Uses `stepAfter` curve
  for gear/DRS (discrete signals), `natural` curve for speed/throttle/brake/rpm.
- `mobile/src/components/race/LapTimesTab.tsx` — added a lap-time trend line chart above
  the existing sector-time table (table stays, it's needed for exact S1/S2/S3 values).
  Trend chart uses `Line` for lap time + `Scatter` (green dots) to mark personal-best laps.
- Decision: `mobile/src/components/race/StrategyTab.tsx`'s `StintBar` (flex-proportional
  colored View segments per tire stint) is already a real timeline/Gantt-style chart, not
  a text/table view — left as-is intentionally, no Victory Native needed there.
- Bonus fix (pre-existing bug found while smoke-testing, unrelated to task 11): in
  `mobile/src/app/(tabs)/news.tsx`, two `<Button variant="outlined">Try again</Button>` /
  `...Load more</Button>` calls passed a raw string as `children`, which crashes on web
  (`@expo/ui`'s universal Button only wraps `children` in `<Text>` if you use the `label`
  prop instead). Fixed both to `<Button variant="outlined" label="Try again" onPress={...} />`
  / `label="Load more"`.
- Verification this phase: `tsc --noEmit` clean, `npm run lint` clean, Metro web bundle
  built successfully (2327 modules) and served `/race/2025-monaco-grand-prix` and
  `/(tabs)/news` both with HTTP 200 and no bundling/parsing/render errors — only expected
  noise (`TypeError: NetworkError when attempting to fetch resource` from the
  `fastlytics-api-proxy-v2.subhashgottumukkala17.workers.dev` worker, since this sandbox
  has no egress to it, and the harmless `Animated: useNativeDriver is not supported` web
  warning).

## Task 12 — Head-to-Head tab (done this phase)

`mobile/src/components/race/HeadToHeadTab.tsx` redesign:

- Driver-1/Driver-2 chip pickers and the two driver summary cards were restyled with
  `@expo/ui` (`Host`/`Row`/`Column`/`Text`/`RNHostView` for the driver avatar + name/team,
  matching the pattern in `OverviewTab.tsx`). Colors for driver 1 (`#dc2626`) / driver 2
  (`#2563eb`) pulled into named constants (`DRIVER_ONE_COLOR`/`DRIVER_TWO_COLOR`) since
  they're now referenced in the new chart too.
- **New chart** (this is what task 12 needed — sector-time deltas are the numeric
  comparison worth visualizing here, matching the web app's `CircuitComparisonChart`
  semantics where `section.driver1Advantage > 0` means driver 1 is faster in that
  section): a diverging bar chart above the existing sector table, using
  `victory-native`'s `CartesianChart` + two `Bar` layers (not one `Bar` with per-point
  colors — `Bar`/`useBarPath` render all points into a single merged Skia path with one
  `color` prop, so per-bar coloring requires splitting the diverging data into two
  non-overlapping series and rendering two `Bar`s, similar to how `StackedBar` works
  under the hood). Data shape: `{ section, positiveAdvantage, negativeAdvantage }` where
  exactly one of the two is non-zero per point (whichever direction `driver1Advantage`
  points), fed as two separate `yKeys` so each `Bar` only draws its own non-zero bars.
  Bars above the zero line are colored `DRIVER_ONE_COLOR`, below are `DRIVER_TWO_COLOR`.
  Domain is `[-max*1.15, max*1.15]` (symmetric around zero) so the zero baseline sits in
  the middle of the chart.
  - Kept the existing sector table below the chart — it still shows exact avg speeds
    (`driver1AvgSpeed`/`driver2AvgSpeed`) which the bar chart doesn't communicate, so
    both together tell the full story like the web app's dominance-map + tooltip does.
- Verification: `tsc --noEmit` clean, `npm run lint` clean. Metro smoke test: since H2H
  isn't the default active tab on the race screen, temporarily changed
  `useState<...>('overview')` to `useState<...>('h2h')` in `mobile/src/app/race/[slug].tsx`,
  ran the Metro web smoke test again (bundle succeeded, `/race/2025-monaco-grand-prix`
  returned 200, only the same expected network-error noise, no crash/parsing errors from
  the new chart code), then reverted the temporary default-tab change (`git diff --stat`
  confirmed no residual diff on `[slug].tsx`).
  - Could NOT do a real interactive/visual check (click into the H2H tab, verify the bars
    render at the right heights/colors) — no browser available for Playwright in this
    sandbox (`browserType.launchPersistentContext: Chromium distribution 'chrome' is not
found`, and `npx playwright install` fails needing sudo). The bundling/runtime-error
    check above is the strongest verification possible here; a real device/simulator or
    a machine with a working browser should do a visual pass on the H2H tab bars before
    shipping.

## Key technical context (don't rediscover this)

- `victory-native@41.26.0` API: `CartesianChart({ data, xKey, yKeys, domain, padding, children })`
  where `children` is a render-prop `({ points, chartBounds, xScale, yScale }) => ReactNode`.
  `points.<yKey>` gives a `PointsArray` to pass into `<Line points={...} color strokeWidth
curveType />`, `<Area points={...} y0={chartBounds.bottom} />`, `<Scatter points={...}
radius color />`, `<Bar points={...} chartBounds={...} color roundedCorners innerPadding />`.
  Valid `curveType` values (from d3-shape): linear, natural, bumpX, bumpY, cardinal,
  cardinal50, catmullRom, catmullRom0, catmullRom100, monotoneX, step, stepAfter,
  stepBefore, basis.
- `Bar`/`HorizontalBar` take a single `color` prop applied to the _entire_ merged path —
  they do NOT support per-point/per-bar colors (confirmed by reading `Bar.js`: it builds
  one `Skia.Path` from all points, then renders one `<Path color={...} />`). For a
  diverging/two-color bar chart (e.g. "which driver is faster per section"), split the
  data into two non-overlapping series (one non-zero, one zero, per point, flipped
  depending on sign) and render two separate `<Bar>` components with two different
  `yKeys`, each colored independently. `getVerticalBarRect` skips points where `y` isn't
  a finite number, so zero-valued bars in the "off" series just don't draw anything —
  no need to filter them out manually.
- `@shopify/react-native-skia` exports `LinearGradient`, `vec(x, y)` from the package root
  (not a subpath) — used for gradient area fills, e.g.
  `<LinearGradient start={vec(0, chartBounds.top)} end={vec(0, chartBounds.bottom)}
colors={['#colorAA', '#color00']} />` nested inside `<Area>`.
- `CartesianChart`'s `data` prop is strictly typed as `Record<string, unknown>[]` — API
  response types like `TelemetrySeriesPoint` (from `mobile/src/lib/api.ts`) don't have an
  index signature, so you must map into a local type with `[key: string]: number` before
  passing to `data`, e.g. `type TelemetryChartPoint = { distance: number; value: number;
[key: string]: number }`. Same pattern was used for lap-time trend data with `NaN` for
  non-personal-best laps' `personalBest` field (Scatter component silently skips points
  where `typeof y !== 'number'`... but `NaN` **is** typeof number, so must explicitly
  filter `points.personalBest` with `Number.isFinite(point.y)` before passing to `<Scatter>`).
- `expo-glass-effect`'s non-`.ios` `GlassView` is literally `<View {...props} />` — zero
  effect off iOS. `AdaptiveGlass.tsx` in `mobile/src/components/` wraps it with `expo-blur`
  BlurView (tint=systemMaterial, intensity=60) fallback. Reuse this, don't re-derive.
- `@expo/ui` universal `Button`: pass `label="text"` for plain text buttons, NOT a raw
  string as `children`. `children` is for custom JSX content (icons, Row of Text/Icon).
  This bug bit us once already in news.tsx — grep for `<Button` across the app if you add
  more buttons and double check none use a bare string child.
- `UniversalStyle` (the `@expo/ui` style prop type) has no `flexDirection`/`gap`/`position`/
  `overflow` — anything needing those (card carousels, absolute-positioned overlays,
  Victory Native chart containers, rounded-corner image clipping) must live in plain RN
  `View`, not inside `Host`/`Column`/`Row`. For images/icons inside a `Host` tree that need
  RN-only styling (e.g. `overflow: 'hidden'` for rounded avatar clipping), wrap the RN
  `View` in `@expo/ui`'s `RNHostView` so it can sit inside `Row`/`Column` layout — see
  `OverviewTab.tsx`'s driver avatar and the driver summary cards in `HeadToHeadTab.tsx`.
- Brand red (`colors.red` etc.) is kept as static hex, NOT `Color.android.dynamic.primary`
  — that resolves through system wallpaper theme and would make brand red drift.
- Icons: `Icon.select({ ios: 'sf.symbol.name', android: import('@expo/material-symbols/x.xml') })`
  pattern, not `@expo/vector-icons`.
- No browser available for Playwright in this sandbox (no system Chrome, no cached
  Playwright browser, `npx playwright install` needs sudo which isn't available
  non-interactively). Visual/interactive verification of new UI is not possible here —
  rely on tsc + lint + Metro bundle/runtime-error smoke tests via curl, and call this
  limitation out explicitly rather than claiming a visual check was done.

## Modified files this phase (for git diff review)

```
mobile/package.json
mobile/src/app/(tabs)/account.tsx
mobile/src/app/(tabs)/calendar.tsx
mobile/src/app/(tabs)/index.tsx
mobile/src/app/(tabs)/news.tsx
mobile/src/app/(tabs)/standings.tsx
mobile/src/app/_layout.tsx
mobile/src/app/drivers.tsx
mobile/src/app/race/[slug].tsx
mobile/src/app/teams.tsx
mobile/src/components/AdaptiveGlass.tsx
mobile/src/components/FavoritePicker.tsx
mobile/src/components/race/OverviewTab.tsx
mobile/src/components/race/TelemetryTab.tsx
mobile/src/components/race/LapTimesTab.tsx
mobile/src/components/race/HeadToHeadTab.tsx
mobile/src/theme/colors.ts
mobile/metro.config.js
```

Note: several of these (account/calendar/index/standings/_layout/drivers/teams/
FavoritePicker/colors.ts/HeadToHeadTab.tsx pre-existing changes/race/[slug].tsx) were
already committed to `main` before this phase started (see `git log --oneline -- <file>`
and `git diff --stat dc9ddc3 2c8e976` — task 1-10 work landed in commit `2c8e976`). Only
`news.tsx`'s Button fix, `TelemetryTab.tsx`, `LapTimesTab.tsx`, `metro.config.js`, and
this rewrite of `HeadToHeadTab.tsx` are _uncommitted_ working-tree changes from tasks
11-12. Run `git status`/`git diff` to see the real uncommitted diff before task 13's
summary — don't assume everything in the list above is uncommitted.

## Next steps in order

1. Task 13: full lint/tsc pass across all changed files (should already be clean — re-run
   as a final check), `git diff --stat` review of the _uncommitted_ changes specifically
   (see note above — most of tasks 1-10 are already committed), summarize the whole
   Phase 3 redesign for the user. Flag the no-browser/no-device limitation on visual
   verification in the final summary.

Delete this file once task 13 is complete and the user has the summary.
