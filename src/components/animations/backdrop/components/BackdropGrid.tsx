import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react';
import { getIdListWithoutExtraRows } from './helper';

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

  const getAmountSquaresX = useCallback((squareSize: number): number => {
    return Math.ceil((window.innerWidth * 1.2) / squareSize);
  }, []);

  const getAmountSquaresY = useCallback((squareSize: number): number => {
    return Math.ceil(window.innerHeight / squareSize);
  }, []);

  const [amountSquaresX, setAmountSquaresX] = useState(
    getAmountSquaresX(getSquareSize())
  );
  const [amountSquaresY, setAmountSquaresY] = useState(
    getAmountSquaresY(getSquareSize())
  );

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
    const squareSize = getSquareSize();
    const currentAmountX = getAmountSquaresX(squareSize);
    const currentAmountY = getAmountSquaresY(squareSize);
    const xChanged = currentAmountX !== amountSquaresX;
    const yChanged = currentAmountY !== amountSquaresY;

    if (xChanged) {
      setAmountSquaresX(currentAmountX);
    }
    if (yChanged) {
      setAmountSquaresY(currentAmountY);
    }
  }, [
    getAmountSquaresX,
    getAmountSquaresY,
    amountSquaresX,
    amountSquaresY,
    getSquareSize,
  ]);

  useEffect(() => {
    // also detects de orientation change on mobile devices
    window.addEventListener('innerWidth', updateSquareMeasurements);
    // resizing on desktop
    window.addEventListener('resize', updateSquareMeasurements);
    return () => {
      window.addEventListener('innerWidth', updateSquareMeasurements);
      window.removeEventListener('resize', updateSquareMeasurements);
    };
  }, [updateSquareMeasurements]);

  useEffect(() => {
    const idsWithoutExtraRows = getIdListWithoutExtraRows(
      ids,
      amountExtraRows - 1
    );

    setIdList(idsWithoutExtraRows);
  }, [ids, setIdList, amountSquaresX]);

  return (
    <div
      style={{
        //        square size + amount of gaps
        top: `-${(getSquareSize() + amountSquaresY) / 2}px`,
        left: `-${(getSquareSize() + amountSquaresX) / 2}px`,
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
        squareSize: getSquareSize(),
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
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className='bg-gm-bg'></div>
      ))}
    </div>
  ));
};
