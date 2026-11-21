import { tokens } from './tokens';

/**
 * Tema adaptado para React Native (StyleSheet).
 * Expone valores numéricos en dp/px y sombras compatibles con Android 10+ / iOS.
 */
export const nativeTheme = {
  colors: tokens.colors,
  typography: tokens.typography,
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadows: {
    sm: tokens.shadows.sm.native,
    md: tokens.shadows.md.native,
  },
} as const;

export type NativeTheme = typeof nativeTheme;
