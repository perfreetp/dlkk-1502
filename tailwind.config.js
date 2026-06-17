/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#EFF4FF',
          100: '#D9E4FF',
          200: '#B8CCFF',
          300: '#8AAAFF',
          400: '#5C85FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA6',
          800: '#061A79',
          900: '#030D4C',
        },
        secondary: {
          50: '#FFF3EA',
          100: '#FFE0CC',
          200: '#FFC999',
          300: '#FFAD66',
          400: '#FF9233',
          500: '#FF7D00',
          600: '#CC6400',
          700: '#994B00',
          800: '#663200',
          900: '#331900',
        },
      },
      animation: {
        'scan': 'scan 1.5s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
      },
    },
  },
  plugins: [],
};
