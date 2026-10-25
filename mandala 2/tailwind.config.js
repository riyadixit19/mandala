/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Calm, earthy colours: warm oat paper, cream panels, moss green and a little clay
      colors: {
        paper: '#F1ECE2',
        card: '#FAF6EE',
        ink: '#2A3732',
        muted: '#56635D',
        line: '#D8D0C0',
        pine: { DEFAULT: '#3D6956', dark: '#30574A', soft: '#E2E9DF' },
        marigold: { DEFAULT: '#C9843D', soft: '#F2E3CD' },
        rust: { DEFAULT: '#A24C33', soft: '#F2E1D8' },
      },
      fontFamily: {
        sans: ['var(--font-lexend)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // small, even corners everywhere
        DEFAULT: '6px',
        md: '6px',
      },
    },
  },
  plugins: [],
};
