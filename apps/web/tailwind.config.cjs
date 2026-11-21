/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/theme/tailwind.preset.cjs')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
};
