import { ZodError, z } from 'zod';
import { parseDataWithZodSchema } from './parse-data-with-zod-schema';
import { FieldValues } from 'react-hook-form';
import { SchemaName } from '../get-schema/get-schema';

describe('parseDataWithZodSchema', () => {
  it('should just pass', () => {
    expect(true).toBe(true);
  });
  it('should parse valid data from FieldValues', () => {
    const data = { name: 'test', age: 10 } as FieldValues;
    const parsed = parseDataWithZodSchema(data, SchemaName.TEST_Z_OBJECT);
    expect(parsed).toEqual({ name: 'test', age: 10 });
  });
  it('should parse valid data from FormData', () => {
    const data = new FormData();
    data.append('name', 'test');
    data.append('age', '10');
    const parsed = parseDataWithZodSchema(data, SchemaName.TEST_Z_OBJECT);
    expect(parsed).toEqual({ name: 'test', age: 10 });
  });
  it('should throw instance of zod error', () => {
    const data = { name: 'test', age: '10' } as FieldValues;
    const schema = z.object({ name: z.string(), age: z.number() });
    try {
      parseDataWithZodSchema(data, SchemaName.TEST_Z_OBJECT);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
    }
  });
});
