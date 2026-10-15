/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-app': '#FDFCFF',
        'surface': '#FFFFFF',
        'purple-50': '#F7F3FF',
        'purple-100': '#EFE8FF',
        'purple-200': '#E0D4FA',
        'pink-50': '#FFF5F9',
        'pink-100': '#FFE8F1',
        'primary': '#6D4FC9',
        'primary-hover': '#5B3FB3',
        'accent-pink': '#D9558A',
        'text-primary': '#2B2740',
        'text-secondary': '#6B6785',
        'border-custom': '#ECE8F5',
        'status-done-bg': '#E8F7EF',
        'status-done-text': '#1F8A57',
        'status-review-bg': '#FFF6E0',
        'status-review-text': '#9A6A00',
        'status-blocked-bg': '#FFE9EC',
        'status-blocked-text': '#C2344D',
        'status-progress-bg': '#E8F0FF',
        'status-progress-text': '#2F5FCC',
        'status-todo-bg': '#F2F0F7',
        'status-todo-text': '#6B6785',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(109,79,201,0.08)',
        'soft-hover': '0 6px 20px rgba(109,79,201,0.12)',
        'modal': '0 20px 40px -15px rgba(109,79,201,0.2)',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
        'input': '8px',
      }
    },
  },
  plugins: [],
}
