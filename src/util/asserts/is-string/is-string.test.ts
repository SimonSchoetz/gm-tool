import { assertIsString } from './is-string';

describe('assertIsString', () => {
  it('should not throw an error if the value is a string', () => {
    expect(() => assertIsString('test')).not.toThrow();
  });

  it('should throw an error if the value is not a string', () => {
    expect(() => assertIsString(123)).toThrow('Value is not a string');
  });
});
