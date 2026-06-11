export const extractColorTriplet = (color: string): string | null => {
  const match = color.match(/\d+/g);
  if (match !== null && match.length >= 3) {
    return `${match[0]}, ${match[1]}, ${match[2]}`;
  }
  return null;
};
