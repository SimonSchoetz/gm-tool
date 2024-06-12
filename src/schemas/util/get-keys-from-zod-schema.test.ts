import { ZodTypeAny, z } from 'zod';
import { getKeysFromZodSchema } from './get-keys-from-zod-schema';

describe('getKeysFromZodSchema', () => {
  it('should return an array of keys if it is a ZodObject', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const keys = getKeysFromZodSchema(schema);
    expect(keys).toEqual(['name', 'age']);
  });

  it('should return an array of keys if it is a ZodEffects', () => {
    const schema = z
      .object({
        name: z.string(),
        age: z.number(),
      })
      .refine((data) => data);
    const keys = getKeysFromZodSchema(schema);
    expect(keys).toEqual(['name', 'age']);
  });
  it('should throw error if input is not handled', () => {
    const schema = { name: 'test', age: 10 };
    //@ts-ignore
    expect(() => getKeysFromZodSchema(schema)).toThrow();
  });
});
