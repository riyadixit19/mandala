/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // A bright crayon box on warm cream paper. The paper colour is a CSS variable
      // so it can turn golden on a three-star day (see globals.css).
      colors: {
        paper: 'var(--paper)',
        card: '#FFFAEF',
        ink: '#21302B',
        muted: '#4F5D57',
        line: '#E7DCC6',
        pine: { DEFAULT: '#23924A', dark: '#1A7339', soft: '#DDF3E3' },
        sky: { DEFAULT: '#1C83D6', dark: '#1468AC', soft: '#DCEEFC' },
        marigold: { DEFAULT: '#F4AE1A', dark: '#C98A07', soft: '#FFF0C4' },
        rust: { DEFAULT: '#E5583B', dark: '#B9422A', soft: '#FDE2DA' },
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'Lato', '"Noto Sans"', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
      },
    },
  },
  plugins: [],
};
