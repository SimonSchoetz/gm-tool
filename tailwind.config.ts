import { colors } from './src/util/styles';
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
        'gm-primary': colors.dark.full,
        'gm-primary-medium-contrast': colors.secondary.full,
        'gm-primary-high-contrast': colors.accent.full,
        'gm-primary-very-high-contrast': colors.bright.full,
      },
    },
    fontFamily: {
      titillium: ['Titillium'],
    },
  },
  plugins: [],
};
export default config;
