/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D12',
        secondary: '#11141B',
        card: '#151922',
        primary: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        accent: '#22D3EE',
        sentiment: {
          positive: '#10B981',
          negative: '#F87171',
          neutral: '#64748B',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
