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
  it('should return a date in the past', () => {
    const now = new Date();
    const expectedDate = new Date(now.getTime() - 60 * 60 * 1000);
    expectedDate.setUTCMilliseconds(0);
    const newDate = getDateFromNowInDuration({ hours: -1 });
    expect(newDate).toEqual(expectedDate);
  });
});
