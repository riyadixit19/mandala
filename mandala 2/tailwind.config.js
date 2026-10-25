/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F3F4F0',
        ink: '#1D2A26',
        muted: '#5E6B66',
        line: '#DDE1DA',
        pine: { DEFAULT: '#2F5D50', dark: '#24493F', soft: '#E3ECE8' },
        marigold: { DEFAULT: '#E39B3A', soft: '#FBEEDB' },
        rust: { DEFAULT: '#A8432F', soft: '#F6E4DF' },
      },
      fontFamily: {
        sans: ['var(--font-figtree)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
