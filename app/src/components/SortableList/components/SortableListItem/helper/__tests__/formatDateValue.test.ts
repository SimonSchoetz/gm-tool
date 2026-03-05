import { describe, it, expect } from 'vitest';
import { formatDateValue } from '../formatDateValue';

describe('formatDateValue', () => {
  it('returns empty string for null', () => {
    expect(formatDateValue(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatDateValue(undefined)).toBe('');
  });

  it('returns empty string for a number (guards against falsy 0 misread)', () => {
    expect(formatDateValue(0)).toBe('');
  });

  it('returns empty string for false', () => {
    expect(formatDateValue(false)).toBe('');
  });

  it('returns empty string for an object', () => {
    expect(formatDateValue({})).toBe('');
  });

  it('returns a formatted en-US date-time string for a valid date string', () => {
    const result = formatDateValue('2024-03-15T10:30:00');
    expect(result).toContain('2024');
    expect(result).toMatch(/[A-Za-z]+ \d{1,2}, \d{4} \d{1,2}:\d{2} (AM|PM)/);
  });
});
