import { SquarePosition } from '../BackdropBeam';

export const mapPathCoordinates = (
  squarePositions: SquarePosition[]
): { x: number; y: number }[] => {
  const startPosition = Math.random() < 0.5 ? 'left' : 'right';

  const offset = startPosition === 'left' ? -0.5 : 0.5;

  const mappedPositions = squarePositions.map((position) => {
    return { y: position.top, x: position[startPosition] + offset };
  });

  console.log('>>>>>>>>> | squarePositions:', squarePositions);
  const lastEl = squarePositions.at(-1)!;
  console.log('>>>>>>>>> | lastEl:', lastEl);
  mappedPositions.push({ y: lastEl.bottom, x: lastEl[startPosition] + offset });

  return mappedPositions;
};
