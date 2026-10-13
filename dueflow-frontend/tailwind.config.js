/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Dueflow green: money, "safe", approve.
        brand: {
          50: '#ecf8f2', 100: '#d3efe2', 200: '#a8dfc6', 300: '#74c8a5', 400: '#44ad84',
          500: '#2a9470', 600: '#1f7a5c', 700: '#1a634c', 800: '#174f3e', 900: '#144133',
        },
      },
    },
  },
  plugins: [],
};
