/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Playful purples, pinks and blues (in the spirit of Khan Academy) on soft lavender paper.
      // The paper colour is a CSS variable so it can turn golden on a three-star day (see globals.css).
      colors: {
        paper: 'var(--paper)',
        card: '#FFFCFF',
        ink: '#1F2147',
        muted: '#565A7E',
        line: '#E3DAF7',
        purple: { DEFAULT: '#7650F0', dark: '#5734CC', soft: '#EEE8FF' },
        blue: { DEFAULT: '#1865F2', dark: '#0F4CBF', soft: '#E2ECFF' },
        pink: { DEFAULT: '#EC4C93', dark: '#C42F72', soft: '#FFE2F0' },
        coral: { DEFAULT: '#FF6B57', dark: '#D84A38', soft: '#FFE6E1' },
        gold: { DEFAULT: '#F7B514', dark: '#C98A07', soft: '#FFF3C9' },
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'Lato', '"Noto Sans"', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        // big, friendly round corners
        DEFAULT: '12px',
        md: '20px',
      },
    },
  },
  plugins: [],
};
