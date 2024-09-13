type Direction = 'left' | 'right' | 'down' | null;

export const decideDirection = (
  lastDirection: Direction,
  maxCols: number,
  currCol: number
): Direction => {
  const directions: Direction[] = ['left', 'right', 'down'];
  if (
    lastDirection === null ||
    (lastDirection === 'left' && currCol === 0) ||
    (lastDirection === 'right' && currCol === maxCols)
  ) {
    return 'down';
  }
  if (
    lastDirection === 'right' ||
    (lastDirection === 'down' && currCol === 0)
  ) {
    return pickRandom(directions.filter((el) => el !== 'left'));
  }
  if (
    lastDirection === 'left' ||
    (lastDirection === 'down' && currCol === maxCols)
  ) {
    return pickRandom(directions.filter((el) => el !== 'right'));
  }
  return pickRandom(directions);
};

const pickRandom = (list: Direction[]): Direction => {
  return list[Math.floor(Math.random() * list.length)];
};
