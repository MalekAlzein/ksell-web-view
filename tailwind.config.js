
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        app: {
          dark: '#0B0D12',
          card: '#1A1D24',
          cardAlt: '#20242C',
          accent: '#B91C2C',
          accentHover: '#9E1626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
