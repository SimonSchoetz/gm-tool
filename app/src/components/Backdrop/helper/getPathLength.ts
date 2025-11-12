export const getPathLength = (path: { x: number; y: number }[]): number => {
  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
};
