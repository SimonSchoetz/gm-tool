import { ZodEffects, ZodError, ZodObject, ZodTypeAny, z } from 'zod';
import { SchemaName, getSchema } from '../get-schema';

export const getKeysFromZodSchema = <T extends ZodTypeAny>(
  schemaName: SchemaName
): (keyof z.infer<T>)[] => {
  const schema = getSchema(schemaName);
  if (schema instanceof ZodObject) {
    return Object.keys(schema.shape) as (keyof z.infer<T>)[];
  }
  if (schema instanceof ZodEffects) {
    try {
      schema.parse({});
    } catch (error) {
      if (error instanceof ZodError) {
        return error.issues.map((issue) => issue.path[0] as keyof z.infer<T>);
      }
    }
  }

  throw new Error('Unexpected schema type');
};
