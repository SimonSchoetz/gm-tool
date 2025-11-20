export const rgbToRgba = (color: string, alpha: number): string => {
  // Extract RGB values from rgb() or rgb() format
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return `rgb(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${alpha})`;
  }
  // Fallback for unexpected format
  return color;
};
