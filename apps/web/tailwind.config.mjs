/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bbdbff',
          300: '#8cc4ff',
          400: '#56a3ff',
          500: '#2f7fff',
          600: '#185fff',
          700: '#104aeb',
          800: '#143dbe',
          900: '#173895',
          950: '#12235b',
        },
        accent: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb2',
          400: '#4ade87',
          500: '#22c564',
          600: '#16a34e',
          700: '#15803f',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        dark: {
          50: '#f6f7f9',
          100: '#ecedf1',
          200: '#d5d7e0',
          300: '#b1b5c5',
          400: '#878da5',
          500: '#686f8a',
          600: '#535873',
          700: '#44485e',
          800: '#3b3e50',
          900: '#343645',
          950: '#1e1f2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
