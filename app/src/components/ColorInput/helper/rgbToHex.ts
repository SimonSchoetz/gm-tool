export const rgbToHex = (rgb: string): string => {
  const parts = rgb.split(', ');
  if (parts.length !== 3) return '#000000';
  const [r, g, b] = parts.map((n) => parseInt(n));
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
