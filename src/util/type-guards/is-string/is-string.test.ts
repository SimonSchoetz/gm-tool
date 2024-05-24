import { isString } from './is-string';

describe('isString', () => {
  it('should return true if the value is a string', () => {
    expect(isString('')).toBe(true);
    expect(isString('a')).toBe(true);
    expect(isString('abc')).toBe(true);
  });
  it('should return false if the value is not string', () => {
    expect(isString(1)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString([])).toBe(false);
  });
});
