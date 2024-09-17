import { ZodError } from 'zod';
import { parseDataWithZodValidator } from './parse-data-with-zod-schema';
import { FieldValues } from 'react-hook-form';
import { ValidatorName } from '../get-validator/get-validator';

describe('parseDataWithZodValidator', () => {
  it('should just pass', () => {
    expect(true).toBe(true);
  });
  it('should parse valid data from FieldValues', () => {
    const data = { name: 'test', age: 10 } as FieldValues;
    const parsed = parseDataWithZodValidator(data, ValidatorName.TEST_Z_OBJECT);
    expect(parsed).toEqual({ name: 'test', age: 10 });
  });
  it('should parse valid data from FormData', () => {
    const data = new FormData();
    data.append('name', 'test');
    data.append('age', '10');
    const parsed = parseDataWithZodValidator(data, ValidatorName.TEST_Z_OBJECT);
    expect(parsed).toEqual({ name: 'test', age: 10 });
  });
  it('should throw instance of zod error', () => {
    const data = { name: 'test', age: '10' } as FieldValues;
    try {
      parseDataWithZodValidator(data, ValidatorName.TEST_Z_OBJECT);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
    }
  });
});
