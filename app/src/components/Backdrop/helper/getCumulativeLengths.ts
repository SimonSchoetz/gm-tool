export const getCumulativeLengths = (
  path: { x: number; y: number }[],
): number[] => {
  const result = [0];
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    result.push(result[i] + Math.sqrt(dx * dx + dy * dy));
  }
  return result;
};
