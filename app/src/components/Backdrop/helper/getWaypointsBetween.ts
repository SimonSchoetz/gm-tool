import { getPositionOnPath } from './getPositionOnPath';

export const getWaypointsBetween = (
  path: { x: number; y: number }[],
  fromProgress: number,
  toProgress: number,
): { x: number; y: number }[] => {
  const start = getPositionOnPath(path, fromProgress);
  const end = getPositionOnPath(path, toProgress);

  if (!start || !end) return [];

  const intermediates: { x: number; y: number }[] = [];

  let accumulated = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    accumulated += Math.sqrt(dx * dx + dy * dy);

    if (accumulated > fromProgress && accumulated < toProgress) {
      intermediates.push(path[i + 1]);
    }

    if (accumulated >= toProgress) break;
  }

  return [start, ...intermediates, end];
};
