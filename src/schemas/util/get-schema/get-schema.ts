import { z } from 'zod';
import * as s from '../../zod-schemas';

export const TestSchemaZObject = z.object({
  name: z.string(),
  age: z.coerce.number(),
});

export const TestSchemaZEffects = z
  .object({
    name: z.string(),
    age: z.coerce.number(),
  })
  .refine((val) => val);

export enum SchemaName {
  TEST_Z_OBJECT = 'testZObject',
  TEST_Z_EFFECTS = 'testZEffects',
  SIGN_UP = 'signUp',
  LOGIN = 'login',
  USER = 'user',
}

export const getSchema = (schema: SchemaName): z.ZodTypeAny => {
  const map: Record<SchemaName, z.ZodTypeAny> = {
    [SchemaName.TEST_Z_OBJECT]: TestSchemaZObject,
    [SchemaName.TEST_Z_EFFECTS]: TestSchemaZEffects,
    [SchemaName.SIGN_UP]: s.SignUpSchema,
    [SchemaName.LOGIN]: s.LoginSchema,
    [SchemaName.USER]: s.UserSchema,
  };

  if (!map[schema]) {
    throw new Error(` Schema "${schema}" not found`);
  }

  return map[schema] as z.ZodTypeAny;
};
