import { describe, it, expect } from 'vitest';
import { getTimeString } from '@util/getTimeString';

describe('getTimeString', () => {
  it.each([
    ['2024-03-15T14:05:00', '2:05 PM'],
    ['2024-03-15T00:30:00', '12:30 AM'],
  ])('formats %s as hour, minute and AM/PM', (dateString, expected) => {
    expect(getTimeString(dateString)).toBe(expected);
  });

  it('fails gracefully', () => {
    expect(getTimeString('no proper date string')).toBe('Invalid Date');
  });
});
