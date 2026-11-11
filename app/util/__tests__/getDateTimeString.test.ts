import { describe, it, expect } from 'vitest';
import { getDateTimeString } from '@util/getDateTimeString';

describe('getDateTimeString', () => {
  it.each([
    ['2024-03-15T10:30:00', 'March 15, 2024 10:30 AM'],
    ['2024-12-01T14:05:00', 'December 1, 2024 2:05 PM'],
  ])(
    'formats %s as date, a space and time with AM/PM',
    (dateString, expected) => {
      expect(getDateTimeString(dateString)).toBe(expected);
    },
  );

  it('formats a string that is no date as the text "Invalid Date Invalid Date", its date part and its time part, instead of throwing', () => {
    const result = getDateTimeString('no proper date string');
    expect(result).toBe('Invalid Date Invalid Date');
  });
});
