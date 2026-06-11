import { getPositionOnPath } from './getPositionOnPath';

export const getWaypointsBetween = (
  path: { x: number; y: number }[],
  cumulativeLengths: number[],
  fromProgress: number,
  toProgress: number,
): { x: number; y: number }[] => {
  const start = getPositionOnPath(path, cumulativeLengths, fromProgress);
  const end = getPositionOnPath(path, cumulativeLengths, toProgress);

  if (!start || !end) return [];

  const intermediates: { x: number; y: number }[] = [];

  for (let i = 1; i < cumulativeLengths.length - 1; i++) {
    if (
      cumulativeLengths[i] > fromProgress &&
      cumulativeLengths[i] < toProgress
    ) {
      intermediates.push(path[i]);
    }
    if (cumulativeLengths[i] >= toProgress) break;
  }

  return [start, ...intermediates, end];
};
