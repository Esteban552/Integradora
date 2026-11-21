/**
 * Punto de entrada del tema compartido para el Panel Web.
 * Además de los tokens en TS, `tailwind.config.cjs` carga el preset compartido
 * `@trabajos/theme/tailwind` generado desde `packages/theme/tokens.json`.
 */
export { tokens } from '@trabajos/theme';
export type { ThemeTokens } from '@trabajos/theme';
