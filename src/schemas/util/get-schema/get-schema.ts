import { ZodTypeAny } from 'zod';
import * as s from '../../requests';
import { z } from 'zod';

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
}

export const getSchema = (schema: SchemaName): ZodTypeAny => {
  const map: Record<SchemaName, ZodTypeAny> = {
    [SchemaName.TEST_Z_OBJECT]: TestSchemaZObject,
    [SchemaName.TEST_Z_EFFECTS]: TestSchemaZEffects,
    [SchemaName.SIGN_UP]: s.SignUpSchema,
    [SchemaName.LOGIN]: s.LoginSchema,
  };
  if (!map[schema]) {
    throw new Error(` Schema "${schema}" not found`);
  }

  return map[schema] as ZodTypeAny;
};
