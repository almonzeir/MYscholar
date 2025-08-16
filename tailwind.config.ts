import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8C42',
          50: '#FFF4ED',
          100: '#FFE6D5',
          200: '#FFCAAA',
          300: '#FFA574',
          400: '#FF8C42',
          500: '#FF6B1A',
          600: '#F04F00',
          700: '#C73E00',
          800: '#9E3200',
          900: '#7F2A00',
          950: '#4A1800',
        },
        secondary: {
          DEFAULT: '#8B5E34',
          50: '#F5F0E8',
          100: '#E8D5C1',
          200: '#D4B896',
          300: '#C09B6B',
          400: '#A67C4A',
          500: '#8B5E34',
          600: '#7A4F2A',
          700: '#693F20',
          800: '#583016',
          900: '#47210C',
          950: '#2D1407',
        },
        accent: {
          DEFAULT: '#FFB15A',
          50: '#FFF8F0',
          100: '#FFEED5',
          200: '#FFDCAA',
          300: '#FFC980',
          400: '#FFB15A',
          500: '#FF9A33',
          600: '#E6820A',
          700: '#B36600',
          800: '#804A00',
          900: '#4D2E00',
          950: '#331F00',
        },
        surface: {
          DEFAULT: '#0E0B07',
          50: '#F7F6F5',
          100: '#E8E5E1',
          200: '#D1CBC3',
          300: '#B0A599',
          400: '#8A7B6B',
          500: '#6B5B4A',
          600: '#544539',
          700: '#3D322A',
          800: '#26201B',
          900: '#0E0B07',
          950: '#080603',
        },
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        warning: {
          DEFAULT: '#FFB020',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FFB020',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#F43F5E',
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      fontWeight: {
        'extra-bold': '800',
        'black': '900',
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 140, 66, 0.3)',
        'glow-lg': '0 0 30px rgba(255, 140, 66, 0.4)',
        'glow-xl': '0 0 40px rgba(255, 140, 66, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(255, 140, 66, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 140, 66, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 140, 66, 0.6)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 140, 66, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 140, 66, 0.6)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      animationDelay: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
        '900': '900ms',
        '1000': '1000ms',
      },
    },
  },
  plugins: [
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.animation-delay-75': {
          'animation-delay': '75ms',
        },
        '.animation-delay-100': {
          'animation-delay': '100ms',
        },
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-delay-200': {
          'animation-delay': '200ms',
        },
        '.animation-delay-300': {
          'animation-delay': '300ms',
        },
        '.animation-delay-400': {
          'animation-delay': '400ms',
        },
        '.animation-delay-500': {
          'animation-delay': '500ms',
        },
        '.animation-delay-600': {
          'animation-delay': '600ms',
        },
        '.animation-delay-700': {
          'animation-delay': '700ms',
        },
        '.animation-delay-800': {
          'animation-delay': '800ms',
        },
        '.animation-delay-900': {
          'animation-delay': '900ms',
        },
        '.animation-delay-1000': {
          'animation-delay': '1000ms',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

export default config