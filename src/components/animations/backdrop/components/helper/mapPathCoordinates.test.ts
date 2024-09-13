import { mapPathCoordinates } from './mapPathCoordinates';

const testData = [
  {
    id: '0-7',
    top: -58.875,
    right: 707.875,
    bottom: 49.875,
    left: 599.125,
  },
  {
    id: '1-7',
    top: 50.875,
    right: 707.875,
    bottom: 159.625,
    left: 599.125,
  },
  {
    id: '1-8',
    top: 50.875,
    right: 817.625,
    bottom: 159.625,
    left: 708.875,
  },
  {
    id: '2-8',
    top: 160.625,
    right: 817.625,
    bottom: 269.375,
    left: 708.875,
  },
  {
    id: '2-7',
    top: 160.625,
    right: 707.875,
    bottom: 269.375,
    left: 599.125,
  },
  {
    id: '2-6',
    top: 160.625,
    right: 598.125,
    bottom: 269.375,
    left: 489.375,
  },
  {
    id: '2-5',
    top: 160.625,
    right: 488.375,
    bottom: 269.375,
    left: 379.625,
  },
  {
    id: '3-5',
    top: 270.375,
    right: 488.375,
    bottom: 379.125,
    left: 379.625,
  },
  {
    id: '3-4',
    top: 270.375,
    right: 378.625,
    bottom: 379.125,
    left: 269.875,
  },
  {
    id: '4-4',
    top: 380.125,
    right: 378.625,
    bottom: 488.875,
    left: 269.875,
  },
];

describe('mapPathCoordinates', () => {
  const mappedCoordinates = mapPathCoordinates(testData);

  it('should return an array with mapped coordinates', () => {
    const keys = Object.keys(mappedCoordinates[0]);

    expect(keys.includes('x') && keys.includes('y')).toBe(true);

    expect(typeof mappedCoordinates[0].x).toBe('number');
    expect(typeof mappedCoordinates[0].y).toBe('number');
  });

  it('should use top coordinate for direct mapped Coordinates', () => {
    testData.forEach((position, i) => {
      expect(position.top).toBe(mappedCoordinates[i].y);
    });
  });

  it('should generate last additional coordinate based on bottom corner', () => {
    expect(mappedCoordinates.at(-1)?.y).toBe(testData.at(-1)?.bottom);
  });

  it('should not generate diagonal coordinate points', () => {
    let prevCoordinate: { x: number; y: number };
    mappedCoordinates.forEach((coordinate) => {
      if (prevCoordinate) {
        expect(
          prevCoordinate.x === coordinate.x || prevCoordinate.y === coordinate.y
        ).toBe(true);
      }
      prevCoordinate = coordinate;
    });
  });

  it('should stick to side it has chosen', () => {
    const { left, right } = testData[0];
    const { x } = mappedCoordinates[0];

    testData.forEach((position, i) => {
      if (x === left) {
        expect(position.left).toBe(mappedCoordinates[i].x);
      }
      if (x === right) {
        expect(position.right).toBe(mappedCoordinates[i].x);
      }
    });
  });
});
