import { getKeysFromZodSchema } from './get-keys-from-zod-schema';
import { SchemaName } from '../get-schema/get-schema';

describe('getKeysFromZodSchema', () => {
  it('should return an array of keys if it is a ZodObject', () => {
    const keys = getKeysFromZodSchema(SchemaName.TEST_Z_OBJECT);
    expect(keys).toEqual(['name', 'age']);
  });

  it('should return an array of keys if it is a ZodEffects', () => {
    const keys = getKeysFromZodSchema(SchemaName.TEST_Z_EFFECTS);
    expect(keys).toEqual(['name', 'age']);
  });
});
