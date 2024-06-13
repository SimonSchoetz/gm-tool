import { ZodEffects, ZodObject } from 'zod';
import { SchemaName, getSchema } from './get-schema';

describe('getSchema', () => {
  it('should return a ZodObject', () => {
    const schema = getSchema(SchemaName.TEST_Z_OBJECT);
    expect(schema).toBeInstanceOf(ZodObject);
  });

  it('should return a ZodEffects', () => {
    const schema = getSchema(SchemaName.TEST_Z_EFFECTS);
    expect(schema).toBeInstanceOf(ZodEffects);
  });

  it('should throw error if input is not handled', () => {
    //@ts-ignore
    expect(() => getSchema(SchemaName.TEST)).toThrow();
  });
});
