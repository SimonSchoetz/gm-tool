import { describe, it, expect } from 'vitest';
import { getDateString } from '@util/getDateString';

describe('getDateString', () => {
  it.each([
    ['2024-03-15T10:30:00', 'March 15, 2024'],
    ['2024-12-01T00:00:00', 'December 1, 2024'],
  ])('formats %s as long month, day and year', (dateString, expected) => {
    expect(getDateString(dateString)).toBe(expected);
  });

  it('fails gracefully', () => {
    const result = getDateString('no proper date string');
    expect(result).toBe('Invalid Date');
  });
});
