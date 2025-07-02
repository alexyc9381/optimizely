/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary purpleish-blue palette
        primary: {
          50: '#f0f4ff',
          100: '#e5edff',
          200: '#d0dcff',
          300: '#aab9ff',
          400: '#7d8cff',
          500: '#5b6cff',
          600: '#4c52ff',
          700: '#3d3eeb',
          800: '#3133bc',
          900: '#2e3295',
          950: '#1c1c59',
        },
        // Secondary purple tones
        secondary: {
          50: '#f7f5ff',
          100: '#f0ebff',
          200: '#e3daff',
          300: '#d0baff',
          400: '#b68fff',
          500: '#9d5fff',
          600: '#8a3fff',
          700: '#7b2bf5',
          800: '#6824d1',
          900: '#561faa',
          950: '#351274',
        },
        // Accent indigo
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Dark background variations
        background: {
          primary: '#0a0b1e',
          secondary: '#12132b',
          tertiary: '#1a1d3a',
          card: '#1e2147',
          hover: '#262a54',
        },
        // Text colors
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
          accent: '#a5b4fc',
        },
        // Status colors in purple tones
        status: {
          success: '#8b5cf6',
          warning: '#a855f7',
          error: '#c026d3',
          info: '#6366f1',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5b6cff 0%, #8a3fff 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0b1e 0%, #1a1d3a 100%)',
      },
      boxShadow: {
        'primary': '0 4px 20px rgba(91, 108, 255, 0.3)',
        'secondary': '0 4px 20px rgba(138, 63, 255, 0.3)',
        'accent': '0 4px 20px rgba(99, 102, 241, 0.3)',
        'glow': '0 0 30px rgba(91, 108, 255, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(91, 108, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(91, 108, 255, 0.8), 0 0 30px rgba(91, 108, 255, 0.4)' }
        }
      }
    },
  },
  plugins: [],
}
