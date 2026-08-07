import { describe, it, expect } from 'vitest';
import { getDateString } from '@util/getDateString';

describe('getDateString', () => {
  it('formats to en-US date pattern', () => {
    const result = getDateString('2024-03-15T10:30:00');
    // en-US: "Month Day, Year"
    expect(result).toMatch(/[A-Za-z]+ \d{1,2}, \d{4}/);
  });

  it('fails gracefully', () => {
    const result = getDateString('no proper date string');
    expect(result).toBe('Invalid Date');
  });
});
