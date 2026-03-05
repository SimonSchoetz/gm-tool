import { describe, it, expect } from 'vitest';
import { getDateTimeString } from '../getDateTimeString';

describe('getDateTimeString', () => {
  it('includes the year from the input date string', () => {
    const result = getDateTimeString('2024-03-15T10:30:00');
    expect(result).toContain('2024');
  });

  it('formats to en-US date-time pattern with AM/PM', () => {
    const result = getDateTimeString('2024-03-15T10:30:00');
    // en-US: "Month Day, Year H:MM AM/PM"
    expect(result).toMatch(/[A-Za-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2} (AM|PM)/);
  });

  it('formats minutes with 2 digits', () => {
    const result = getDateTimeString('2024-06-01T09:05:00');
    expect(result).toMatch(/:\d{2} (AM|PM)/);
  });

  it('returns a non-empty string', () => {
    const result = getDateTimeString('2024-01-01T00:00:00');
    expect(result.length).toBeGreaterThan(0);
  });
});
