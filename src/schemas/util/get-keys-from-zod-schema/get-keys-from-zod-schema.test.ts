import { z } from 'zod';
import { getKeysFromZodSchema } from './get-keys-from-zod-schema';
import { SchemaName } from '../get-schema/get-schema';

describe('getKeysFromZodSchema', () => {
  it('should return an array of keys if it is a ZodObject', () => {
    const keys = getKeysFromZodSchema(SchemaName.TEST_Z_OBJECT);
    expect(keys).toEqual(['name', 'age']);
  });

  it('should return an array of keys if it is a ZodEffects', () => {
    const schema = z
      .object({
        name: z.string(),
        age: z.number(),
      })
      .refine((data) => data);
    const keys = getKeysFromZodSchema(SchemaName.TEST_Z_EFFECTS);
    expect(keys).toEqual(['name', 'age']);
  });
  it('should throw error if input is not handled', () => {
    const schema = { name: 'test', age: 10 };
    //@ts-ignore
    expect(() => getKeysFromZodSchema(SchemaName.TEST)).toThrow();
  });
});
