import { describe, it, expect } from 'vitest';
import { getDateTimeString } from '@util/getDateTimeString';

describe('getDateTimeString', () => {
  it('formats to en-US date-time pattern with AM/PM', () => {
    const result = getDateTimeString('2024-03-15T10:30:00');
    // en-US: "Month Day, Year H:MM AM/PM"
    expect(result).toMatch(/[A-Za-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2} (AM|PM)/);
  });

  it('fails gracefully', () => {
    const result = getDateTimeString('no proper date string');
    expect(result).toBe('Invalid Date Invalid Date');
  });
});
