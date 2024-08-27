'use client';

import { useCallback, useEffect, useState } from 'react';

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

  const squares = getSquares({
    amountSquaresX,
    amountSquaresY,
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
  amountSquaresX: number;
  amountSquaresY: number;
  squareSize: number;
  maxSize: number;
};

const getSquares = ({
  amountSquaresX,
  amountSquaresY,
  squareSize,
  maxSize,
}: SquaresConfig) => {
  const squares = [];
  for (let rowNum = 0; rowNum < amountSquaresY; rowNum++) {
    for (let colNum = 0; colNum < amountSquaresX; colNum++) {
      const identifier = `${rowNum}-${colNum}`;

      squares.push(
        <div
          id={identifier}
          key={identifier}
          style={{
            width: `${squareSize}px`,
            height: `${squareSize}px`,
            maxWidth: `${maxSize}px`,
            maxHeight: `${maxSize}px`,
          }}
          className=' bg-gm-primary'
        ></div>
      );
    }
  }
  return <>{squares}</>;
};
