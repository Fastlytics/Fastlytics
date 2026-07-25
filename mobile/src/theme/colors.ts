import { Platform } from 'react-native';
import { Color } from 'expo-router';

export const colors = {
  background: '#000000',
  surface: '#0a0a0a',
  card: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: '#000000',
  })!,
  cardBorder: 'rgba(255,255,255,0.1)',
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
  systemRed: Platform.select({
    ios: Color.ios.systemRed,
    android: Color.android.dynamic.error,
    default: '#dc2626',
  })!,
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
  red: '#dc2626',
  redDark: '#b91c1c',
  zinc900: '#18181b',
  zinc800: '#27272a',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
};
