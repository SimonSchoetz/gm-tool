import { useState, useEffect } from 'react';
import {
  getPathSquareIds,
  getSquarePositions,
  SquarePosition,
  mapPathCoordinates,
} from './helper';
import { ConditionWrapper } from '@/components/wrapper';

type BackdropBeamProps = {
  idList: string[];
};

const BackdropBeam = ({ idList }: BackdropBeamProps) => {
  const [squarePositions, setSquarePositions] = useState<SquarePosition[]>([]);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[]>(
    []
  );
  const [duration, setDuration] = useState<number>(100);

  useEffect(() => {
    let isMounted = true;

    const updateSquarePositions = async () => {
      while (isMounted) {
        const pathSquareIds = getPathSquareIds(idList);
        const positionsForPathSquares = getSquarePositions(pathSquareIds);

        setSquarePositions(positionsForPathSquares);

        const randomDelay = Math.random() * 15000 + 5000;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      }
    };

    updateSquarePositions();

    return () => {
      isMounted = false;
    };
  }, [idList]);

  useEffect(() => {
    if (squarePositions.length) {
      const newCoordinates = mapPathCoordinates(squarePositions);

      setCoordinates(newCoordinates);
      setDuration(3000 / newCoordinates.length);
    }
  }, [squarePositions]);

  return <LightBeam coordinates={coordinates} duration={duration} />;
};

export default BackdropBeam;

type LightBeamProps = {
  coordinates: { x: number; y: number }[];
  duration: number;
};

const LightBeam = ({ coordinates, duration }: LightBeamProps) => {
  const [nextPosition, setNextPosition] = useState<{
    x: number;
    y: number;
  }>({ x: -100, y: 0 });
  const [isLastCoordinateReached, setIsLastCoordinateReached] = useState(false);

  useEffect(() => {
    const stepThroughPixelPositions = async () => {
      setIsLastCoordinateReached(false);
      for (const coordinate of coordinates) {
        setNextPosition(coordinate);
        await new Promise((resolve) => setTimeout(resolve, duration));
      }
      setIsLastCoordinateReached(true);
      setNextPosition({ x: -100, y: 0 });
    };
    stepThroughPixelPositions();
  }, [coordinates, duration]);

  return (
    <ConditionWrapper condition={!isLastCoordinateReached}>
      <BeamParticles duration={duration} nextPosition={nextPosition} />
    </ConditionWrapper>
  );
};

type BeamParticlesProps = {
  duration: number;
  nextPosition: { x: number; y: number };
};

const BeamParticles = ({ duration, nextPosition }: BeamParticlesProps) => {
  return Array.from({ length: duration }, (_, index) => {
    return (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: `${nextPosition?.x}px`,
          top: `${nextPosition?.y}px`,
          width: '.5px',
          height: '.5px',
          border: 'solid .5px',
          borderRadius: '100px',
          transitionTimingFunction: 'linear',
          transitionDuration: `${duration}ms`,
          transitionDelay: `${index}ms`,
          opacity: `${1 - 0.01 * index}`,
          borderColor: 'var(--gm-secondary)',
        }}
      />
    );
  });
};
