import { getIdListWithoutExtraRows } from './get-id-list-without-extra-rows';

describe('getIdListWithoutExtraRows', () => {
  it('should return an array of ids without the extra rows', () => {
    const expectedResult = testList.slice(0, 20); //from '0-1' to '1-10'
    const result = getIdListWithoutExtraRows(testList, 2);

    expect(result).toEqual(expectedResult);
  });
});

const testList = [
  '0-1',
  '0-2',
  '0-3',
  '0-4',
  '0-5',
  '0-6',
  '0-7',
  '0-8',
  '0-9',
  '0-10',
  '1-1',
  '1-2',
  '1-3',
  '1-4',
  '1-5',
  '1-6',
  '1-7',
  '1-8',
  '1-9',
  '1-10',
  '2-1',
  '2-2',
  '2-3',
  '2-4',
  '2-5',
  '2-6',
  '2-7',
  '2-8',
  '2-9',
  '2-10',
  '3-1',
  '3-2',
  '3-3',
  '3-4',
  '3-5',
  '3-6',
  '3-7',
  '3-8',
  '3-9',
  '3-10',
];
