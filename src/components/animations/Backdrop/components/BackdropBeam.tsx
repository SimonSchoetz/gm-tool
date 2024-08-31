import { useState, useEffect } from 'react';
import { getPathSquareIds, getSquarePositions, SquarePosition } from './helper';
import { mapPathCoordinates } from './helper';
import { ConditionWrapper } from '@/components/wrapper';
import { colors } from '@/util/styles';

type BackdropBeamProps = {
  idList: string[];
};

const BackdropBeam = ({ idList }: BackdropBeamProps) => {
  const [squarePositions, setSquarePositions] = useState<SquarePosition[]>([]);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[]>(
    []
  );
  const [nextPosition, setNextPosition] = useState<{
    x: number;
    y: number;
  }>({ x: -100, y: 0 });

  const [duration, setDuration] = useState<number>(100);

  useEffect(() => {
    const updateSquarePositions = async () => {
      while (true) {
        const pathSquareIds = getPathSquareIds(idList);
        const positionsForPathSquares = getSquarePositions(pathSquareIds);

        setSquarePositions(positionsForPathSquares);

        const randomDelay = Math.random() * 10000 + 5000;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      }
    };

    updateSquarePositions();
  }, [idList]);

  useEffect(() => {
    if (squarePositions.length) {
      const newCoordinates = mapPathCoordinates(squarePositions);

      setCoordinates(newCoordinates);
      setDuration(3000 / newCoordinates.length);
    }
  }, [squarePositions]);

  useEffect(() => {
    const updatePixelPosition = async () => {
      for (const coordinate of coordinates) {
        setNextPosition(coordinate);
        await new Promise((resolve) => setTimeout(resolve, duration));
      }
      setNextPosition({ x: -100, y: 0 });
    };
    updatePixelPosition();
  }, [coordinates, duration]);

  return (
    <ConditionWrapper condition={!!nextPosition}>
      {renderBeam(nextPosition, duration)}
    </ConditionWrapper>
  );
};

export default BackdropBeam;

const renderBeam = (position: { x: number; y: number }, duration: number) => {
  return Array.from({ length: duration }, (_, index) => {
    return (
      <div
        className='beam'
        key={index}
        style={{
          position: 'absolute',
          left: `${position?.x}px`,
          top: `${position?.y}px`,
          width: '.5px',
          height: '.5px',
          border: 'solid .5px',
          borderRadius: '100px',
          transitionTimingFunction: 'linear',
          transitionDuration: `${duration}ms`,
          transitionDelay: `${index}ms`,
          opacity: `${1 - 0.008 * index}`,
          borderColor: colors.secondary.full,
        }}
      />
    );
  });
};
