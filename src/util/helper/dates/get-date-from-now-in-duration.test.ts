import { getDateFromNowInDuration } from './get-date-from-now-in-duration';

describe('getDateFromNowInDuration', () => {
  it('should return the current date plus 30 days', () => {
    const now = new Date();
    const newDate = getDateFromNowInDuration({ days: 30 });
    const expectedDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    expectedDate.setUTCMilliseconds(0);
    expect(newDate).toEqual(expectedDate);
  });
  it('should return the current date plus 7 minutes', () => {
    const now = new Date();
    const newDate = getDateFromNowInDuration({ minutes: 7 });
    const expectedDate = new Date(now.getTime() + 7 * 60 * 1000);
    expectedDate.setUTCMilliseconds(0);
    expect(newDate).toEqual(expectedDate);
  });
});
