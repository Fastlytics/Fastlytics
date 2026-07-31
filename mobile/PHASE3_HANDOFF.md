# Phase 3 Mobile Redesign — Handoff Notes

Native `@expo/ui` (Material You / SwiftUI) + Liquid Glass (iOS) + Victory Native charts,
replacing the web-styled RN Views in `mobile/`. No physical device/simulator available —
validation is `tsc --noEmit`, `npm run lint`, and Metro web smoke tests via
`npx expo start --web` + curl.

Read
PHASE3_HANDOFF.md
and continue Phase 3 of the mobile redesign from where it left off — re-verify tsc/lint/Metro smoke test after the news.tsx Button fix, then move to task 12 (Head-to-Head tab).

## Progress: 11/13 tasks

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
- [x] 11. Victory Native charts — **IN PROGRESS, see "Right now" below**
- [ ] 12. Redesign Head-to-Head tab (`components/race/HeadToHeadTab.tsx`) — not started,
      file not yet read this phase
- [ ] 13. Final full lint/tsc/diff validation + summarize the whole Phase 3 redesign

## Right now (task 11 status)

Done and verified (tsc clean, lint clean):

- `mobile/src/components/race/TelemetryTab.tsx` — manual `View`-height-percentage bar
  approximation replaced with real `victory-native` `CartesianChart` + `Area` (gradient
  fill via `@shopify/react-native-skia` `LinearGradient`) + `Line`. Uses `stepAfter` curve
  for gear/DRS (discrete signals), `natural` curve for speed/throttle/brake/rpm.
- `mobile/src/components/race/LapTimesTab.tsx` — added a lap-time trend line chart above
  the existing sector-time table (table stays, it's needed for exact S1/S2/S3 values).
  Trend chart uses `Line` for lap time + `Scatter` (green dots) to mark personal-best laps.
- Decision: `mobile/src/components/race/StrategyTab.tsx`'s `StintBar` (flex-proportional
  colored View segments per tire stint) is already a real timeline/Gantt-style chart, not
  a text/table view — **left as-is intentionally**, no Victory Native needed there.
- Bonus fix (pre-existing bug found while smoke-testing, unrelated to task 11): in
  `mobile/src/app/(tabs)/news.tsx`, two `<Button variant="outlined">Try again</Button>` /
  `...Load more</Button>` calls passed a raw string as `children`, which crashes on web
  (`@expo/ui`'s universal Button only wraps `children` in `<Text>` if you use the `label`
  prop instead — raw string children must already be valid JSX). Fixed both to
  `<Button variant="outlined" label="Try again" onPress={...} />` /
  `label="Load more"`. Confirmed `label` prop works identically on iOS/Android/web
  Button implementations (read all three `index.{ios,android,tsx}` files).

**Not yet done for task 11**: after the news.tsx fix, I was about to re-run:

```
node node_modules/typescript/bin/tsc -p mobile/tsconfig.json --noEmit --pretty false   (from repo root)
npm run lint   (from mobile/, needs timeout ~300s)
```

then a Metro web smoke test:

```
npx expo start --web   (cwd mobile/, run in background)
# wait ~30-40s (victory-native/skia bundle is large, took longer than usual @expo/ui-only bundles)
curl -s "http://localhost:8081/race/2025-monaco-grand-prix" -o /dev/null -w "%{http_code}"
curl -s "http://localhost:8081/(tabs)/news" -o /dev/null -w "%{http_code}"
# check output for crashes vs expected noise:
#   - "TypeError: Failed to fetch" from fastlytics-api-proxy-v2.subhashgottumukkala17.workers.dev
#     (expected if sandbox/dev machine has no egress to that worker)
#   - "Animated: useNativeDriver is not supported" warning (expected on web, harmless)
# then stop the background process
```

Then task 11 is done → move to task 12.

## Key technical context (don't rediscover this)

- `victory-native@41.26.0` API: `CartesianChart({ data, xKey, yKeys, domain, padding, children })`
  where `children` is a render-prop `({ points, chartBounds, xScale, yScale }) => ReactNode`.
  `points.<yKey>` gives a `PointsArray` to pass into `<Line points={...} color strokeWidth
curveType />`, `<Area points={...} y0={chartBounds.bottom} />`, `<Scatter points={...}
radius color />`. Valid `curveType` values (from d3-shape): linear, natural, bumpX, bumpY,
  cardinal, cardinal50, catmullRom, catmullRom0, catmullRom100, monotoneX, step, stepAfter,
  stepBefore, basis.
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
- `UniversalStyle` (the `@expo/ui` style prop type) has no `flexDirection`/`gap`/`position`
  — anything needing those (card carousels, absolute-positioned overlays, Victory Native
  chart containers) must live in plain RN `View`, not inside `Host`/`Column`/`Row`.
- Brand red (`colors.red` etc.) is kept as static hex, NOT `Color.android.dynamic.primary`
  — that resolves through system wallpaper theme and would make brand red drift.
- Icons: `Icon.select({ ios: 'sf.symbol.name', android: import('@expo/material-symbols/x.xml') })`
  pattern, not `@expo/vector-icons`.

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
mobile/src/theme/colors.ts
```

## Next steps in order

1. Re-run tsc + lint (should already be clean, just re-verify after the news.tsx fix)
2. Metro web smoke test on `/race/2025-monaco-grand-prix` and `/(tabs)/news`
3. Task 12: read `mobile/src/components/race/HeadToHeadTab.tsx`, redesign with native
   styling, add a relevant chart if there's a numeric comparison worth visualizing
   (e.g. sector time deltas) — otherwise it may just need `@expo/ui` treatment like
   OverviewTab got.
4. Task 13: full lint/tsc pass across all changed files, `git diff --stat` review,
   summarize the whole Phase 3 redesign for the user.

Delete this file once task 13 is complete and the user has the summary.
