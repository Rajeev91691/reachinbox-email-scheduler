/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        figma: {
          green: '#00A34D',
          'green-hover': '#008c42',
          'green-light': '#E8F8F0',
          'green-border': '#A7F3D0',
          amber: '#FEF3C7',
          'amber-text': '#D97706',
          bg: '#FFFFFF',
          surface: '#F9FAFB',
          input: '#F3F4F6',
          border: '#E5E7EB',
          text: '#111827',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
