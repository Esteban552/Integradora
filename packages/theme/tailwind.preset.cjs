const tokens = require('./tokens.json');

const toPxMap = (scale) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, `${value}px`])
  );

const c = tokens.colors;
const sem = c.semantic;

// Escala numérica usada por los componentes existentes (no viene en tokens.json).
const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 };
const lineHeight = { xs: 16, sm: 20, md: 24, lg: 26, xl: 28, '2xl': 32, '3xl': 36 };

/**
 * Preset de Tailwind CSS para el Panel Web Administrador (React + Vite + Tailwind).
 * Consume directamente `tokens.json` (tokens finales de diseño) para garantizar paridad
 * visual con móvil sin duplicar valores ni requerir compilación previa.
 * Se conservan los alias anteriores (brand, neutral, semantic) como compatibilidad.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Tokens finales de diseño
        primary: c.primary,
        secondary: c.secondary,
        surface: c.surface,
        content: c.text,
        status: sem,
        // Alias de compatibilidad (derivados de los anteriores)
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
      fontFamily: {
        sans: [tokens.typography.fontFamily.sans, 'system-ui', 'sans-serif'],
        mono: [tokens.typography.fontFamily.mono, 'monospace'],
      },
      fontSize: Object.fromEntries(
        Object.entries(fontSize).map(([key, size]) => [
          key,
          [`${size}px`, { lineHeight: `${lineHeight[key]}px` }],
        ])
      ),
      spacing: { 0: '0px', ...toPxMap(tokens.spacing), 10: '40px' },
      borderRadius: { none: '0px', ...toPxMap(tokens.radii), xl: `${tokens.radii.lg}px` },
      boxShadow: {
        sm: tokens.shadows['1'].web,
        md: tokens.shadows['2'].web,
        lg: tokens.shadows['3'].web,
      },
    },
  },
};
