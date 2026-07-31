import { Platform } from 'react-native';
import { Color } from 'expo-router';

/**
 * Fastlytics brand seed. Passed to `<Host seedColor={colors.seed} />` so Android
 * derives a real Material 3 (Material You) tonal palette from the brand red rather
 * than the user's wallpaper, and iOS gets the same red as its SwiftUI tint.
 * Keeping colors.ts and the Host seed in sync means the fallback hex values below
 * and the on-device generated palette always agree.
 */
const BRAND_SEED = '#dc2626';

/**
 * Platform-native semantic colors.
 *
 * - iOS values are `Color.ios.*` (UIKit semantic colors) — automatically light/dark aware.
 * - Android values are `Color.android.dynamic.*` (Material 3 / Material You dynamic colors) —
 *   derived from the Host `seedColor` when rendered inside an `@expo/ui` `Host`, or from the
 *   default Material theme elsewhere.
 * - `default` is the web/fallback hex, matching the original Fastlytics dark palette.
 *
 * NOTE: Android dynamic colors only reflect their live value inside components that
 * re-render on theme change. Call `useColorScheme()` in any component using these values
 * so it re-renders correctly (required with the React Compiler).
 */
export const colors = {
  seed: BRAND_SEED,

  background: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.background,
    default: '#000000',
  })!,
  surface: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceContainer,
    default: '#0a0a0a',
  })!,
  card: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: '#000000',
  })!,
  cardBorder: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: 'rgba(255,255,255,0.1)',
  })!,

  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: '#ffffff',
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#9ca3af',
  })!,
  tertiaryLabel: Platform.select({
    ios: Color.ios.tertiaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#6b7280',
  })!,
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: '#c6c6c8',
  })!,

  /**
   * Brand accent colors are intentionally NOT `Color.android.dynamic.*`.
   * Dynamic Material colors resolve through the system-wide wallpaper theme when used
   * outside an `@expo/ui` `Host`, which would make Fastlytics' red identity follow the
   * user's wallpaper. Brand color should stay Fastlytics red regardless of platform or
   * wallpaper, so these use a static hex on both platforms.
   *
   * `@expo/ui` `Host` trees get a *seeded* (not wallpaper-driven) Material 3 palette by
   * passing `seedColor={colors.seed}` to `Host` directly - that's the correct place for
   * brand-tinted dynamic color, scoped to Compose/SwiftUI-rendered children only.
   */
  systemRed: BRAND_SEED,
  red: BRAND_SEED,
  redDark: '#b91c1c',

  systemBlue: Platform.select({
    ios: Color.ios.systemBlue,
    android: Color.android.dynamic.primary,
    default: '#007aff',
  })!,
  systemYellow: Platform.select({
    ios: Color.ios.systemYellow,
    android: Color.android.dynamic.tertiary,
    default: '#eab308',
  })!,

  zinc900: Platform.select({
    ios: Color.ios.secondarySystemBackground,
    android: Color.android.dynamic.surfaceContainerLow,
    default: '#18181b',
  })!,
  zinc800: Platform.select({
    ios: Color.ios.tertiarySystemBackground,
    android: Color.android.dynamic.surfaceContainerHigh,
    default: '#27272a',
  })!,

  gray500: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#6b7280',
  })!,
  gray600: Platform.select({
    ios: Color.ios.tertiaryLabel,
    android: Color.android.dynamic.outline,
    default: '#4b5563',
  })!,
  gray700: Platform.select({
    ios: Color.ios.quaternaryLabel,
    android: Color.android.dynamic.outlineVariant,
    default: '#374151',
  })!,
};
