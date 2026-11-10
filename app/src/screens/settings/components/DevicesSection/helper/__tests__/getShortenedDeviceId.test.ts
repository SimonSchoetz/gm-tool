import { describe, it, expect } from 'vitest';
import { getShortenedDeviceId } from '../getShortenedDeviceId';

describe('getShortenedDeviceId', () => {
  it('keeps the first eight characters of a long id', () => {
    expect(getShortenedDeviceId('0123456789abcdef')).toBe('01234567');
  });

  it('returns an id shorter than eight characters whole', () => {
    expect(getShortenedDeviceId('abc')).toBe('abc');
  });
});
