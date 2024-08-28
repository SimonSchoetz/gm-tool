import { useState, useEffect } from 'react';
import { getPathSquareIds } from './helper';
import { mapPathCoordinates } from './helper/mapPathCoordinates';

type BackdropBeamProps = {
  idList: string[];
};

const BackdropBeam = ({ idList }: BackdropBeamProps) => {
  const [squarePositions, setSquarePositions] = useState<SquarePosition[]>([]);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }[]>(
    []
  );
  useEffect(() => {
    const pathSquareIds = getPathSquareIds(idList);
    const positionsForPathSquares = getSquarePositions(pathSquareIds);

    setSquarePositions(positionsForPathSquares);
  }, [idList]);

  useEffect(() => {
    if (squarePositions.length) {
      setCoordinates(mapPathCoordinates(squarePositions));
    }
  }, [squarePositions]);
  return <div>Enter</div>;
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
