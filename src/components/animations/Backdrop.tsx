'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const Backdrop = () => {
  const maxSize = 120;

  const getSquareSize = (): number => {
    return Math.min(window.innerWidth / 8, maxSize);
  };

  const [squareSize, setSquareSize] = useState(getSquareSize());

  const getAmountSquaresX = useCallback((): number => {
    return Math.ceil((window.innerWidth * 1.2) / squareSize);
  }, [squareSize]);

  const getAmountSquaresY = useCallback((): number => {
    return Math.ceil(window.innerHeight / squareSize);
  }, [squareSize]);

  const [amountSquaresX, setAmountSquaresX] = useState(getAmountSquaresX());
  const [amountSquaresY, setAmountSquaresY] = useState(getAmountSquaresY());

  const updateSquareMeasurements = useCallback(() => {
    setSquareSize(getSquareSize());
    setAmountSquaresX(getAmountSquaresX());
    setAmountSquaresY(getAmountSquaresY());
  }, [getAmountSquaresX, getAmountSquaresY]);

  useEffect(() => {
    window.addEventListener('resize', updateSquareMeasurements);
    return () => {
      window.removeEventListener('resize', updateSquareMeasurements);
    };
  }, [updateSquareMeasurements]);

  const ids = useMemo(() => {
    const ids: string[] = [];
    // extra row prevents a too wide gap in specific window width
    for (let rowNum = 0; rowNum < amountSquaresY + 1; rowNum++) {
      for (let colNum = 0; colNum < amountSquaresX; colNum++) {
        ids.push(`${rowNum}-${colNum}`);
      }
    }
    return ids;
  }, [amountSquaresX, amountSquaresY]);

  const squares = getSquares({
    ids,
    squareSize,
    maxSize,
  });

  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      className='overflow-hidden absolute -z-10'
    >
      <div
        style={{
          //        square size + amount of gaps
          top: `-${(squareSize + amountSquaresY) / 2}px`,
          left: `-${(squareSize + amountSquaresX) / 2}px`,
        }}
        className='
          bg-gm-primary-high-contrast-10 
          w-[120vw] h-[120vh]  
          flex flex-wrap gap-[1px]
          absolute
        '
      >
        {squares}
      </div>
    </div>
  );
};

export default Backdrop;

type SquaresConfig = {
  ids: string[];
  squareSize: number;
  maxSize: number;
};

const getSquares = ({ ids, squareSize, maxSize }: SquaresConfig) => {
  return ids.map((id) => (
    <div
      id={id}
      key={id}
      style={{
        width: `${squareSize}px`,
        height: `${squareSize}px`,
        maxWidth: `${maxSize}px`,
        maxHeight: `${maxSize}px`,
      }}
      className='bg-gm-primary'
    ></div>
  ));
};
