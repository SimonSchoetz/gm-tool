export const getPositionOnPath = (
  path: { x: number; y: number }[],
  cumulativeLengths: number[],
  distance: number,
): { x: number; y: number } | null => {
  if (path.length < 2) return null;

  for (let i = 0; i < path.length - 1; i++) {
    if (cumulativeLengths[i + 1] >= distance) {
      const segmentLength = cumulativeLengths[i + 1] - cumulativeLengths[i];
      if (segmentLength === 0) return path[i];
      const t = (distance - cumulativeLengths[i]) / segmentLength;
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      return { x: path[i].x + dx * t, y: path[i].y + dy * t };
    }
  }

  return path.at(-1) ?? null;
};
