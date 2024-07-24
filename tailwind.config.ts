import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gm-primary': '#031322',
        'gm-primary-medium-contrast': '#2B4D57',
        'gm-primary-high-contrast': '#399CBB',
        'gm-primary-very-high-contrast': '#F8FBFB',
      },
    },
  },
  plugins: [],
};
export default config;
