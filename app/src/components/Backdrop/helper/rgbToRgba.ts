export const rgbToRgba = (color: string, alpha: number): string => {
  console.log('>>>>>>>>> | rgbToRgba | color:', color);
  // Extract RGB values from rgb() or rgba() format
  const rgbMatch = color.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${alpha})`;
  }
  // Fallback for unexpected format
  return color;
};
