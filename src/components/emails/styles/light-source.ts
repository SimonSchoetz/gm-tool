import { emailColors as colors } from './color';

export const lightSource: React.CSSProperties = {
  background: `linear-gradient(to bottom right, ${colors.primary['30']}, transparent)`,
};

export const lightSourceDim: React.CSSProperties = {
  background: `linear-gradient(to bottom right, ${colors.primary['10']}, transparent)`,
};
