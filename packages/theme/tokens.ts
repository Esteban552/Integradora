import rawTokens from './tokens.json';

/**
 * Tokens de diseño finales (Aleksey, tokens.json v1.0.0).
 *
 * `tokens.json` es la única fuente de verdad. Este archivo expone dos vistas:
 *  - `design`: los tokens tal cual los entregó diseño (primary.600, surface.card,
 *    typography.scale.h1, shadows.1, etc.). Usar esta vista en pantallas nuevas.
 *  - `tokens`: capa de compatibilidad con la API anterior (brand/neutral/semantic,
 *    fontSize xs..3xl, radius, shadows sm/md) para que los componentes existentes
 *    sigan funcionando. Todos sus colores se derivan de `design`; no hay valores duplicados.
 *
 * No duplicar colores ni tamaños en pantallas de móvil o web.
 */
export const design = rawTokens;

const c = rawTokens.colors;
const sem = c.semantic;

export const tokens = {
  colors: {
    brand: {
      primary: c.primary['600'],
      primaryHover: c.primary['700'],
      primarySoft: c.primary['100'],
      secondary: c.secondary['700'],
      secondarySoft: c.secondary['100'],
    },
    neutral: {
      background: c.surface.background,
      surface: c.surface.card,
      surfaceMuted: c.surface.subtle,
      border: c.surface.border,
      textPrimary: c.text.primary,
      textSecondary: c.text.secondary,
      textMuted: c.text.muted,
      textInverse: c.text.inverted,
    },
    semantic: {
      success: sem.success.text,
      successSoft: sem.success.bg,
      warning: sem.warning.text,
      warningSoft: sem.warning.bg,
      danger: sem.error.text,
      dangerSoft: sem.error.bg,
      info: sem.info.text,
      infoSoft: sem.info.bg,
    },
  },
  typography: {
    fontFamily: rawTokens.typography.fontFamily,
    // Escala numérica usada por los componentes existentes (no viene en tokens.json).
    fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
    lineHeight: { xs: 16, sm: 20, md: 24, lg: 26, xl: 28, '2xl': 32, '3xl': 36 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    scale: rawTokens.typography.scale,
  },
  spacing: { 0: 0, ...rawTokens.spacing, 10: 40 },
  radius: { none: 0, ...rawTokens.radii, xl: rawTokens.radii.lg },
  shadows: {
    sm: rawTokens.shadows['1'],
    md: rawTokens.shadows['2'],
    lg: rawTokens.shadows['3'],
  },
};

export type ThemeTokens = typeof tokens;
export type DesignTokens = typeof design;
export type ColorTokens = ThemeTokens['colors'];
export type TypographyTokens = ThemeTokens['typography'];
export type SpacingTokens = ThemeTokens['spacing'];
export type RadiusTokens = ThemeTokens['radius'];
