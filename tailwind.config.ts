import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          2: '#132236',
          3: '#1A2F47',
          4: '#1E3A5F',
        },
        accent: {
          DEFAULT: '#3B82F6',
          2: '#06B6D4',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        purple: '#8B5CF6',
        text: {
          1: '#F0F4F8',
          2: '#94A3B8',
          3: '#64748B',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
