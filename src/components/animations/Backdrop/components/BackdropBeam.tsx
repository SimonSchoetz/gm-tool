import { useState, useEffect, useMemo } from 'react';
import { getPathSquareIds } from './helper';
import { mapPathCoordinates } from './helper/mapPathCoordinates';
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
    const pathSquareIds = getPathSquareIds(idList);
    const positionsForPathSquares = getSquarePositions(pathSquareIds);

    setSquarePositions(positionsForPathSquares);
  }, [idList]);

  useEffect(() => {
    const updateCoordinates = async () => {
      while (squarePositions.length) {
        console.log(
          '>>>>>>>>> | updateCoordinates | squarePositions:',
          squarePositions.length
        );
        const newCoordinates = mapPathCoordinates(squarePositions);
        console.log(
          '>>>>>>>>> | updateCoordinates | newCoordinates:',
          newCoordinates.length
        );
        setCoordinates(newCoordinates);
        setDuration(3000 / newCoordinates.length);

        const randomDelay = Math.random() * 10000 + 5000;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      }
    };

    if (squarePositions.length) {
      updateCoordinates(); // Start the update process
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
      {getBeam(nextPosition, duration)}
    </ConditionWrapper>
  );
};

export default BackdropBeam;

export type SquarePosition = {
  id: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const getSquarePositions = (idList: string[]): SquarePosition[] => {
  return idList
    .map<SquarePosition | null>((id) => {
      const element = document.getElementById(id);
      if (element) {
        const { top, right, bottom, left } = element.getBoundingClientRect();
        return { id, top, right, bottom, left };
      }
      return null;
    })
    .filter(Boolean) as SquarePosition[];
};

const getBeam = (position: { x: number; y: number }, duration: number) => {
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
          opacity: `${1 - 0.01 * index}`,
          borderColor: colors.secondary.full,
        }}
      />
    );
  });
};
