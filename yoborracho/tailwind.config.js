/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E75B6',
          light: '#4A90D9',
          dark: '#1F5A94',
        },
        accent: {
          DEFAULT: '#2E75B6',
          light: '#4A90D9',
          dark: '#1F5A94',
        },
        surface: {
          DEFAULT: '#0A0A0B',
          2: '#131316',
          3: '#1C1C21',
          4: '#26262C',
          5: '#38383F',
        },
        ink: {
          DEFAULT: '#F5F5F7',
          muted: '#8E8E93',
          faint: '#5C5C61',
        },
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.14em',
      },
    },
  },
  plugins: [],
}
