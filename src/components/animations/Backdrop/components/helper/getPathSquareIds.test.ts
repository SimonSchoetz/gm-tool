import { getPathSquareIds } from './getPathSquareIds';

describe('getPathSquareIds', () => {
  const rowZero = ['0-0', '0-1', '0-2', '0-3', '0-4', '0-5'];
  const rowOne = ['1-0', '1-1', '1-2', '1-3', '1-4', '1-5'];
  const rowTwo = ['2-0', '2-1', '2-2', '2-3', '2-4', '2-5'];
  const rowThree = ['3-0', '3-1', '3-2', '3-3', '3-4', '3-5'];
  const testList = [...rowZero, ...rowOne, ...rowTwo, ...rowThree];

  const idList = getPathSquareIds(testList);

  it('should return an array', () => {
    expect(Array.isArray(idList)).toBe(true);
  });

  it('array items should be strings', () => {
    expect(typeof idList[0]).toBe('string');
  });

  describe('should curate a list', () => {
    it('with ascending row numbers', () => {
      let previousRowNum: number = 0;
      idList.forEach((el) => {
        const rowNum = el.split('-').map(Number)[0];
        expect(rowNum === previousRowNum || rowNum === previousRowNum + 1).toBe(
          true
        );
        expect(rowNum === previousRowNum || rowNum >= previousRowNum + 1).toBe(
          true
        );
        expect(rowNum < previousRowNum || rowNum >= previousRowNum + 2).toBe(
          false
        );
        previousRowNum = rowNum;
      });
    });

    it('where columns of rows are either direct neighbors or the same', () => {
      let previousColNum: number = 0;

      idList.forEach((el, i) => {
        const colNum = el.split('-').map(Number)[1];
        if (i === 0) {
          previousColNum = colNum;
        }

        expect(
          colNum === previousColNum || Math.abs(colNum - previousColNum) === 1
        ).toBe(true);

        previousColNum = colNum;
      });
    });
    it('when consecutive rows are the same the column must have changed', () => {
      let previousColNum: number = 0;
      let previousRowNum: number = 0;

      idList.forEach((el) => {
        const [rowNum, colNum] = el.split('-').map(Number);
        if (rowNum === previousRowNum) {
          expect(colNum !== previousColNum).toBe(true);
          expect(colNum === previousColNum).toBe(false);
        }
        previousColNum = colNum;
        previousRowNum = rowNum;
      });
    });

    it('when consecutive rows are different the column must not have changed', () => {
      let previousColNum: number = 0;
      let previousRowNum: number = 0;

      idList.forEach((el) => {
        const [rowNum, colNum] = el.split('-').map(Number);
        if (rowNum !== previousRowNum) {
          expect(colNum === previousColNum).toBe(true);
          expect(colNum !== previousColNum).toBe(false);
        }
        previousColNum = colNum;
        previousRowNum = rowNum;
      });
    });

    it('where first and last row is always included', () => {
      const firstRowNum = idList.at(0)?.split('-').map(Number)[0];
      const lastRowNum = idList.at(-1)?.split('-').map(Number)[0];
      expect(firstRowNum).toBe(0);
      expect(lastRowNum).toBe(3);
    });
  });
});
