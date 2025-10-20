import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        base: {
          light: '#0b0e14',
          dark: '#070911'
        },
        accent: {
          1: '#7c6cff',
          2: '#0bc2ff',
        }
      },
      backgroundImage: {
        'grid': 'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(800px 400px at 20% 10%, rgba(124,108,255,0.25), transparent), radial-gradient(800px 400px at 80% 0%, rgba(11,194,255,0.18), transparent)'
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(124,108,255,0.35), 0 10px 40px rgba(124,108,255,0.25)',
        'soft': '0 10px 30px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
} satisfies Config
