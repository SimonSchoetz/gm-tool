import { nowInXDays } from './now-in-x-days';

describe('nowInXDays', () => {
  it('should return the current date plus 30 days', () => {
    const now = new Date();
    const newDate = nowInXDays(30);
    const expectedDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    expectedDate.setMilliseconds(0);
    expect(newDate).toEqual(expectedDate);
  });
});
