/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#f8f2f5',
          100: '#eddfe6',
          200: '#dbc2cf',
          300: '#c29db1',
          400: '#a3718d',
          500: '#7e4768',
          600: '#5f2b48',
          700: '#48182F', // Primary Burgundy
          800: '#391124',
          900: '#2c0c1b',
          950: '#1b0610',
        },
        moonstone: {
          50: '#FAF8F7',  // Warm White
          100: '#EEE9E6', // Light Moonstone
          200: '#D4CBC4', // Secondary Warm Moonstone
          300: '#C2B6AD',
          400: '#A8998E',
          500: '#8C7C71',
          600: '#716157',
          700: '#56483F',
          800: '#3C312A',
          900: '#231B16',
        },
        brand: {
          burgundy: '#48182F',
          moonstone: '#D4CBC4',
          lightMoonstone: '#EEE9E6',
          warmWhite: '#FAF8F7',
          darkText: '#241B20',
          mutedText: '#756A70',
          border: '#D8CFD2',
        },
        klu: {
          50: '#FAF8F7',
          100: '#EEE9E6',
          200: '#D4CBC4',
          300: '#D8CFD2',
          400: '#756A70',
          500: '#5f2b48',
          600: '#48182F',
          700: '#48182F', // Institutional Primary Burgundy
          800: '#391124',
          900: '#2c0c1b',
          950: '#1b0610',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(72, 24, 47, 0.04), 0 1px 2px 0 rgba(72, 24, 47, 0.02)',
        'card': '0 4px 12px -2px rgba(72, 24, 47, 0.05), 0 2px 4px -1px rgba(72, 24, 47, 0.03)',
        'modal': '0 20px 40px -15px rgba(44, 12, 27, 0.25)',
      }
    },
  },
  plugins: [],
}

