const tokens = require('./tokens.json');

const toPxMap = (scale) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, `${value}px`])
  );

/**
 * Preset de Tailwind CSS para el Panel Web Administrador (React + Vite + Tailwind).
 * Consume directamente `tokens.json` para garantizar 100% paridad visual con móvil
 * sin duplicar valores ni requerir compilación previa.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        neutral: tokens.colors.neutral,
        semantic: tokens.colors.semantic,
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily.sans, 'system-ui', 'sans-serif'],
        mono: [tokens.typography.fontFamily.mono, 'monospace'],
      },
      fontSize: Object.fromEntries(
        Object.entries(tokens.typography.fontSize).map(([key, size]) => [
          key,
          [
            `${size}px`,
            { lineHeight: `${tokens.typography.lineHeight[key]}px` },
          ],
        ])
      ),
      spacing: toPxMap(tokens.spacing),
      borderRadius: toPxMap(tokens.radius),
      boxShadow: {
        sm: tokens.shadows.sm.web,
        md: tokens.shadows.md.web,
      },
    },
  },
};
