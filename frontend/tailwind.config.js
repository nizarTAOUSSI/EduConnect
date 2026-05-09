/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-50': '#fafaf9',
        'slate-500': '#78716c',
        'slate-800': '#292524',
        'slate-900': '#1c1917',
        'primary': '#4f46e5',
        'primary-light': '#818cf8',
        'secondary': '#0ea5e9',
        'success': '#10b981',
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
