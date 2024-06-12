import { ZodEffects, ZodError, ZodObject, ZodTypeAny, z } from 'zod';

export const getKeysFromZodSchema = <T extends ZodTypeAny>(
  schema: T
): (keyof z.infer<T>)[] => {
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
