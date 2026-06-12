import { getColor } from './getColor';

export const buildCompositeColor = () => {
  const bgRgb = getColor('--color-bg-rgb');
  const primaryRgb = getColor('--color-primary-rgb');
  const [bgR, bgG, bgB] = bgRgb.split(',').map(Number);
  const [primaryR, primaryG, primaryB] = primaryRgb.split(',').map(Number);
  return `rgb(${Math.round(bgR + primaryR * 0.1)}, ${Math.round(bgG + primaryG * 0.1)}, ${Math.round(bgB + primaryB * 0.1)})`;
};
