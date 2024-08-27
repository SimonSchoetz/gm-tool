import { useState, useEffect } from 'react';
import { getPathSquareIds } from './helper';
type SquarePosition = {
  id: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type BackdropBeamProps = {
  idList: string[];
};

const BackdropBeam = ({ idList }: BackdropBeamProps) => {
  const [squarePositions, setSquarePositions] = useState<SquarePosition[]>([]);

  useEffect(() => {
    const pathSquareIds = getPathSquareIds(idList);
    const positionsForPathSquares = getSquarePositions(pathSquareIds);
    console.log(
      '>>>>>>>>> | useEffect | positionsForPathSquares:',
      positionsForPathSquares
    );

    setSquarePositions(positionsForPathSquares);
  }, [idList]);

  return <div>Enter</div>;
};

export default BackdropBeam;

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
