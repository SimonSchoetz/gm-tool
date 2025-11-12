export const getPositionOnPath = (
  path: { x: number; y: number }[],
  distance: number
): { x: number; y: number } | null => {
  if (path.length < 2) return null;

  let accumulated = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (accumulated + segmentLength >= distance) {
      const t = (distance - accumulated) / segmentLength;
      return {
        x: path[i].x + dx * t,
        y: path[i].y + dy * t,
      };
    }
    accumulated += segmentLength;
  }

  return path[path.length - 1];
};
