/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2A6FAF',
          50: '#E3EEF8',
          100: '#C7DDF1',
          200: '#8FBBE3',
          300: '#5799D5',
          400: '#2A6FAF',
          500: '#2A6FAF',
          600: '#22598C',
          700: '#1A4369',
          800: '#122D46',
          900: '#0A1723',
        },
        secondary: {
          DEFAULT: '#29A68C',
          50: '#E3F7F3',
          100: '#C7EFE7',
          200: '#8FDFCF',
          300: '#57CFB7',
          400: '#29A68C',
          500: '#29A68C',
          600: '#218570',
          700: '#196454',
          800: '#114338',
          900: '#09221C',
        },
        accent: {
          DEFAULT: '#DC8C73',
          50: '#F9EEE9',
          100: '#F3DDD3',
          200: '#E7BBA7',
          300: '#DB997B',
          400: '#DC8C73',
          500: '#DC8C73',
          600: '#B0705C',
          700: '#845445',
          800: '#58382E',
          900: '#2C1C17',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}