/* eslint-env node */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Typography System Integration
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        // Semantic typography sizes
        'display-2xl': [
          '4.5rem',
          { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.05em' },
        ],
        'display-xl': [
          '3.75rem',
          { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.05em' },
        ],
        'display-lg': [
          '3rem',
          { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.025em' },
        ],
        'heading-xl': [
          '2.25rem',
          {
            lineHeight: '2.5rem',
            fontWeight: '700',
            letterSpacing: '-0.025em',
          },
        ],
        'heading-lg': [
          '1.875rem',
          {
            lineHeight: '2.25rem',
            fontWeight: '600',
            letterSpacing: '-0.025em',
          },
        ],
        'heading-md': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'heading-xs': [
          '1.125rem',
          { lineHeight: '1.75rem', fontWeight: '600' },
        ],
        'body-xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-xs': [
          '0.75rem',
          { lineHeight: '1rem', fontWeight: '400', letterSpacing: '0.025em' },
        ],
        'label-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'label-sm': [
          '0.75rem',
          { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0.025em' },
        ],
      },
      fontFamily: {
        inter: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'Consolas',
          'Courier New',
          'monospace',
        ],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
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
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5b6cff 0%, #8a3fff 100%)',
        'gradient-secondary':
          'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0b1e 0%, #1a1d3a 100%)',
      },
      boxShadow: {
        primary: '0 4px 20px rgba(91, 108, 255, 0.3)',
        secondary: '0 4px 20px rgba(138, 63, 255, 0.3)',
        accent: '0 4px 20px rgba(99, 102, 241, 0.3)',
        glow: '0 0 30px rgba(91, 108, 255, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(91, 108, 255, 0.5)' },
          '100%': {
            boxShadow:
              '0 0 20px rgba(91, 108, 255, 0.8), 0 0 30px rgba(91, 108, 255, 0.4)',
          },
        },
      },
    },
  },
  plugins: [],
};
