import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react';

export type BackdropGridProps = {
  setIdList: Dispatch<SetStateAction<string[]>>;
};

const BackdropGrid = ({ setIdList }: BackdropGridProps) => {
  const maxSize = 120;
  // extra rows prevent a too wide gap at specific window widths
  const amountExtraRows = 5;

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

  const ids = useMemo(() => {
    const ids: string[] = [];

    for (let rowNum = 0; rowNum < amountSquaresY + amountExtraRows; rowNum++) {
      for (let colNum = 1; colNum < amountSquaresX; colNum++) {
        ids.push(`${rowNum}-${colNum}`);
      }
    }
    return ids;
  }, [amountSquaresX, amountSquaresY]);

  const updateSquareMeasurements = useCallback(() => {
    setSquareSize(getSquareSize());

    const currentAmountX = getAmountSquaresX();
    const currentAmountY = getAmountSquaresY();
    const xChanged = currentAmountX !== amountSquaresX;
    const yChanged = currentAmountY !== amountSquaresY;

    if (xChanged) {
      setAmountSquaresX(getAmountSquaresX());
    }
    if (yChanged) {
      setAmountSquaresY(getAmountSquaresY());
    }
  }, [getAmountSquaresX, getAmountSquaresY, amountSquaresX, amountSquaresY]);

  useEffect(() => {
    window.addEventListener('resize', updateSquareMeasurements);
    return () => {
      window.removeEventListener('resize', updateSquareMeasurements);
    };
  }, [updateSquareMeasurements]);

  useEffect(() => {
    // subtract extra rows
    const amountExtraSquares = amountSquaresX * (amountExtraRows - 1);
    setIdList(ids.slice(0, -amountExtraSquares));
  }, [ids, setIdList]);

  return (
    <div
      style={{
        //        square size + amount of gaps
        top: `-${(squareSize + amountSquaresY) / 2}px`,
        left: `-${(squareSize + amountSquaresX) / 2}px`,
      }}
      className='
          bg-gm-primary-10 
          w-[120vw] h-[120vh]  
          flex flex-wrap gap-[1px]
          absolute
        '
    >
      {getSquares({
        ids,
        squareSize,
        maxSize,
      })}
    </div>
  );
};

export default BackdropGrid;

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
      className='bg-gm-bg-50 grid grid-rows-2 grid-cols-2 gap-[1px]'
    >
      <div className='bg-gm-bg'></div>
      <div className='bg-gm-bg'></div>
      <div className='bg-gm-bg'></div>
      <div className='bg-gm-bg'></div>
    </div>
  ));
};
