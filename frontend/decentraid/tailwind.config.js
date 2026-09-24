/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#101418',
          muted: '#4A5462',
          soft: '#6B7684',
        },
        canvas: '#F4F6F8',
        line: '#E2E6EB',
        shell: {
          DEFAULT: '#12181C',
          hover: '#1C2429',
          line: '#2A343A',
        },
        seal: {
          50: '#EAF3F1',
          100: '#CFE4E0',
          200: '#9DC9C2',
          400: '#2E8078',
          600: '#0E5A54',
          700: '#0A443F',
        },
        brass: {
          100: '#F4E8D2',
          500: '#B07A2B',
          700: '#7E561D',
        },
        ok: { 50: '#E8F4EC', 500: '#1B7F4B', 700: '#145C36' },
        warn: { 50: '#FBF0DF', 500: '#A96412', 700: '#7D4A0C' },
        bad: { 50: '#FBEAE8', 500: '#B3261E', 700: '#8A1D16' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 20, 24, 0.04), 0 1px 3px rgba(16, 20, 24, 0.06)',
        pop: '0 12px 32px rgba(16, 20, 24, 0.16)',
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
