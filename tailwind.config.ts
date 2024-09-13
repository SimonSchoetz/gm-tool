import type { Config } from 'tailwindcss';
/**
 * keep in sanc with src/app/_styles/colors.scss
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gm-fg': 'var(--gm-fg)',
        'gm-fg-01': 'var(--gm-fg-01)',
        'gm-fg-05': 'var(--gm-fg-05)',
        'gm-fg-10': 'var(--gm-fg-10)',
        'gm-fg-20': 'var(--gm-fg-20)',
        'gm-fg-30': 'var(--gm-fg-30)',
        'gm-fg-50': 'var(--gm-fg-50)',
        'gm-bg': 'var(--gm-bg)',
        'gm-bg-01': 'var(--gm-bg-01)',
        'gm-bg-05': 'var(--gm-bg-05)',
        'gm-bg-10': 'var(--gm-bg-10)',
        'gm-bg-20': 'var(--gm-bg-20)',
        'gm-bg-30': 'var(--gm-bg-30)',
        'gm-bg-50': 'var(--gm-bg-50)',
        'gm-primary': 'var(--gm-primary)',
        'gm-primary-01': 'var(--gm-primary-01)',
        'gm-primary-05': 'var(--gm-primary-05)',
        'gm-primary-10': 'var(--gm-primary-10)',
        'gm-primary-20': 'var(--gm-primary-20)',
        'gm-primary-30': 'var(--gm-primary-30)',
        'gm-primary-50': 'var(--gm-primary-50)',
        'gm-secondary': 'var(--gm-secondary)',
        'gm-secondary-01': 'var(--gm-secondary-01)',
        'gm-secondary-05': 'var(--gm-secondary-05)',
        'gm-secondary-10': 'var(--gm-secondary-10)',
        'gm-secondary-20': 'var(--gm-secondary-20)',
        'gm-secondary-30': 'var(--gm-secondary-30)',
        'gm-secondary-50': 'var(--gm-secondary-50)',
      },
    },
    fontFamily: {
      titillium: ['Titillium'],
    },
  },
  plugins: [],
};
export default config;
