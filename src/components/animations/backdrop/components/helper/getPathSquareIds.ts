import { decideDirection } from './decideDirection';

export const getPathSquareIds = (idList: string[]): string[] => {
  const lastId = idList.at(-1);
  if (!lastId) return [];

  const [amountRows, amountCol] = lastId.split('-').map(Number);
  const startCol = getRandomStartColumn(amountCol);
  const curatedList: string[] = [];

  let currentRow = 0;
  let currentCol = startCol;
  let currentDirection = null;

  while (currentRow <= amountRows) {
    curatedList.push(`${currentRow}-${currentCol}`);

    const newDirection = decideDirection(
      currentDirection,
      amountCol,
      currentCol
    );

    switch (newDirection) {
      case 'left':
        currentCol--;
        break;
      case 'right':
        currentCol++;
        break;
      default:
        currentRow++;
    }

    currentDirection = newDirection;
  }

  return curatedList;
};

const getRandomStartColumn = (amountColumns: number): number => {
  return Math.floor(Math.random() * (amountColumns + 1));
};
