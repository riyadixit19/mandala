/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // A calm outdoor scene: flat sky, white clouds, a sage hill, and soft salmon, periwinkle,
      // peach and pale-yellow accents. The page colour is a CSS variable so it can turn golden
      // on a three-star day (see globals.css).
      colors: {
        paper: 'var(--paper)',
        card: '#FFFEFC',
        ink: '#2B2E35',
        muted: '#676C76',
        line: '#D9E3E7',
        hill: { DEFAULT: '#619F85', light: '#79B497' },
        leaf: { DEFAULT: '#4E8C71', dark: '#3F765E', soft: '#DCEDE4' },
        lilac: { DEFAULT: '#8794E0', dark: '#6E7BCC', soft: '#E4E8FA' },
        rose: { DEFAULT: '#E3908A', dark: '#C9736D', soft: '#F8E1DE' },
        peach: { DEFAULT: '#EBAA86', dark: '#D58E68', soft: '#FAE7DB' },
        sun: { DEFAULT: '#F0C24B', dark: '#D7A62B', soft: '#F3F1B5' },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
        md: '20px',
        xl: '28px',
        '2xl': '36px',
      },
    },
  },
  plugins: [],
};
