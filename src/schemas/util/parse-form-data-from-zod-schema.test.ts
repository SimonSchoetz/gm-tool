import { ZodError, z } from 'zod';
import { parseFormDataFromZodSchema } from './parse-form-data-from-zod-schema';
import { FieldValues } from 'react-hook-form';

describe('parseFormDataFromZodSchema', () => {
  it('should just pass', () => {
    expect(true).toBe(true);
  });
  it('should parse valid data from FieldValues', () => {
    const data = { name: 'test', age: 10 } as FieldValues;
    const schema = z.object({ name: z.string(), age: z.number() });
    const parsed = parseFormDataFromZodSchema(data, schema);
    expect(parsed).toEqual({ name: 'test', age: 10 });
  });
  it('should parse valid data from FormData', () => {
    const data = new FormData();
    data.append('age', '10');
    data.append('name', 'test');
    const schema = z.object({ name: z.string(), age: z.string() });
    const parsed = parseFormDataFromZodSchema(data, schema);
    expect(parsed).toEqual({ name: 'test', age: '10' });
  });
  it('should throw instance of zod error', () => {
    const data = { name: 'test', age: '10' } as FieldValues;
    const schema = z.object({ name: z.string(), age: z.number() });
    try {
      parseFormDataFromZodSchema(data, schema);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
    }
  });
});
