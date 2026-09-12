import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F5F7',
        surface: '#FFFFFF',
        blue: {
          DEFAULT: '#0059FF',
          dim: 'rgba(0, 89, 255, 0.08)',
          mid: 'rgba(0, 89, 255, 0.18)',
          soft: 'rgba(0, 89, 255, 0.04)',
        },
        ink: {
          DEFAULT: '#1D1D1F',
          soft: '#6E6E73',
          faint: '#86868B',
        },
        line: {
          DEFAULT: 'rgba(0, 0, 0, 0.08)',
          strong: 'rgba(0, 0, 0, 0.12)',
        },
        good: {
          DEFAULT: '#1D8A4F',
          dim: 'rgba(29, 138, 79, 0.1)',
        },
        warn: {
          DEFAULT: '#B87B14',
          dim: 'rgba(184, 123, 20, 0.1)',
        },
        danger: {
          DEFAULT: '#D70015',
          dim: 'rgba(215, 0, 21, 0.08)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          'SF Pro Text',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'ui-monospace',
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        display: ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
        h1: ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        h2: ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        h3: ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
        lift: '0 2px 8px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.06)',
        modal: '0 24px 80px rgba(0, 0, 0, 0.18)',
        focus: '0 0 0 4px rgba(0, 89, 255, 0.18)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-up': 'fade-up 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
