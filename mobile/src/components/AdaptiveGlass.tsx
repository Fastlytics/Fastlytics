import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

interface AdaptiveGlassProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Whether the glass responds to touch (adds a highlight on press). Ignored on the BlurView fallback. */
  isInteractive?: boolean;
  /** BlurView tint used on Android/older iOS where real Liquid Glass isn't available. */
  fallbackTint?:
    | 'systemMaterial'
    | 'systemThinMaterial'
    | 'systemUltraThinMaterial'
    | 'systemThickMaterial'
    | 'dark';
  /** BlurView intensity (0-100) for the fallback. */
  fallbackIntensity?: number;
}

/**
 * A card/surface that renders real iOS 26+ Liquid Glass (`GlassView`) when available,
 * and falls back to `expo-blur`'s `BlurView` everywhere else (older iOS, Android, web).
 * `GlassView` is a no-op plain `View` outside iOS, so the BlurView fallback is required
 * to get any translucent/blurred surface on Android.
 */
export default function AdaptiveGlass({
  children,
  style,
  isInteractive = false,
  fallbackTint = 'systemMaterial',
  fallbackIntensity = 60,
}: AdaptiveGlassProps) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView isInteractive={isInteractive} style={style}>
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView tint={fallbackTint} intensity={fallbackIntensity} style={style}>
      {children}
    </BlurView>
  );
}
