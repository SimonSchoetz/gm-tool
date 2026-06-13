import { getColor } from './getColor';

export const buildCompositeColor = () => {
  const bgRgb = getColor('--color-bg-rgb');
  const [bgR, bgG, bgB] = bgRgb.split(',').map(Number);

  const primaryRgb = getColor('--color-primary-rgb');
  const [primaryR, primaryG, primaryB] = primaryRgb.split(',').map(Number);

  const alpha = 0.1;

  const red = Math.round(bgR + primaryR * alpha);
  const green = Math.round(bgG + primaryG * alpha);
  const blue = Math.round(bgB + primaryB * alpha);

  return `rgb(${red}, ${green}, ${blue})`;
};
