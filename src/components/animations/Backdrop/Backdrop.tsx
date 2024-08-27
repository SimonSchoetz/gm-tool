'use client';

import { useCallback, useEffect, useState } from 'react';
import { BackdropBeam, BackdropGrid } from './components';
type SquarePosition = {
  id: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const Backdrop = () => {
  const [idList, setIdList] = useState<string[]>([]);

  const [squarePositions, setSquarePositions] = useState<SquarePosition[]>([]);
  console.log('>>>>>>>>> | Backdrop | squarePositions:', squarePositions);

  const getSquarePositions = useCallback((): SquarePosition[] => {
    //Todo: filter ids with algorithm that provides only the needed Ids for a path
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
  }, [idList]);

  useEffect(() => {
    setSquarePositions(getSquarePositions());
  }, [getSquarePositions]);
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      className='overflow-hidden absolute -z-10'
    >
      <BackdropGrid setIdList={setIdList} />
      <BackdropBeam />
    </div>
  );
};

export default Backdrop;
