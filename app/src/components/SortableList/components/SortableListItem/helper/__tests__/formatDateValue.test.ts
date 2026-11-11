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

  it('returns the en-US long date and 12-hour time for a valid date string', () => {
    expect(formatDateValue('2024-03-15T10:30:00')).toBe(
      'March 15, 2024 10:30 AM',
    );
  });

  it('formats a string that is no date as the text "Invalid Date Invalid Date", not as the stored string', () => {
    expect(formatDateValue('no proper date string')).toBe(
      'Invalid Date Invalid Date',
    );
  });
});
