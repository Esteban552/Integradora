import { design, tokens } from './tokens';

/**
 * Tema adaptado para React Native (StyleSheet).
 * Expone valores numéricos en dp/px y sombras compatibles con Android 10+ / iOS.
 * `design` trae los tokens finales de diseño (paleta 50-900, semánticos con bg/text/border/dot,
 * escala tipográfica h1/body/label, sombras 1-3).
 */
export const nativeTheme = {
  colors: tokens.colors,
  typography: tokens.typography,
  spacing: tokens.spacing,
  radius: tokens.radius,
  shadows: {
    sm: tokens.shadows.sm.native,
    md: tokens.shadows.md.native,
    lg: tokens.shadows.lg.native,
  },
  design: {
    colors: design.colors,
    scale: design.typography.scale,
    shadows: {
      1: design.shadows['1'].native,
      2: design.shadows['2'].native,
      3: design.shadows['3'].native,
    },
  },
} as const;

export type NativeTheme = typeof nativeTheme;
