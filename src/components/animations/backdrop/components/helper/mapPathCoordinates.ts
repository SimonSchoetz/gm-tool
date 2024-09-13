import { SquarePosition } from './getSquarePositions';

export const mapPathCoordinates = (
  squarePositions: SquarePosition[]
): { x: number; y: number }[] => {
  const startPosition = Math.random() < 0.5 ? 'left' : 'right';

  const offset = startPosition === 'left' ? -0.5 : 0.5;

  const mappedPositions = squarePositions.map((position) => {
    return { y: position.top, x: position[startPosition] + offset };
  });

  const lastEl = squarePositions.at(-1)!;

  mappedPositions.push({ y: lastEl.bottom, x: lastEl[startPosition] + offset });

  return mappedPositions;
};
