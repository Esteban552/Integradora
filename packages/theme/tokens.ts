import rawTokens from './tokens.json';

/**
 * Tokens de diseño base (Fase 0).
 *
 * TODO(Aleksey): Actualizar `packages/theme/tokens.json` con la paleta,
 * tipografía, espaciados, radios y sombras definitivos.
 * No duplicar colores ni tamaños en pantallas de móvil o web.
 */
export const tokens = rawTokens;

export type ThemeTokens = typeof tokens;
export type ColorTokens = ThemeTokens['colors'];
export type TypographyTokens = ThemeTokens['typography'];
export type SpacingTokens = ThemeTokens['spacing'];
export type RadiusTokens = ThemeTokens['radius'];
