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

  const getSquares = () => {
    const amountSquares = amountSquaresX * amountSquaresY;
    const squares = [];
    for (let i = 0; i < amountSquares; i++) {
      squares.push(
        <div
          key={`${i}`}
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
    return <>{squares}</>;
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      className='overflow-hidden absolute -z-10'
    >
      <div
        style={{
          top: `-${squareSize / 2 + amountSquaresY / 2}px`,
          left: `-${squareSize / 2 + amountSquaresX / 2}px`,
        }}
        className='
        bg-gm-primary-high-contrast-10 
        w-[120vw] 
        h-[120vh]  
        flex
        flex-wrap 
        absolute
        gap-[1px] 
        '
      >
        {getSquares()}
      </div>
    </div>
  );
};

export default Backdrop;
