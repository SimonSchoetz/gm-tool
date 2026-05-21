export const rgbToHex = (rgb: string): string => {
  const [r, g, b] = rgb.split(', ').map((n) => parseInt(n));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
