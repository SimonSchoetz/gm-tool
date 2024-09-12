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
  AUTH_COOKIE_PAYLOAD = 'authCookiePayload',
  LOGIN = 'login',
  SIGN_UP = 'signUp',
  TEST_Z_EFFECTS = 'testZEffects',
  TEST_Z_OBJECT = 'testZObject',
  USER = 'user',
  VERIFICATION_EMAIL = 'verificationEmail',
}

export const getSchema = (schema: SchemaName): z.ZodTypeAny => {
  const map: Record<SchemaName, z.ZodTypeAny> = {
    [SchemaName.TEST_Z_OBJECT]: TestSchemaZObject,
    [SchemaName.TEST_Z_EFFECTS]: TestSchemaZEffects,
    [SchemaName.SIGN_UP]: s.SignUpSchema,
    [SchemaName.LOGIN]: s.LoginSchema,
    [SchemaName.USER]: s.UserSchema,
    [SchemaName.AUTH_COOKIE_PAYLOAD]: s.AuthCookiePayloadSchema,
    [SchemaName.VERIFICATION_EMAIL]: s.VerificationEmailSchema,
  };

  if (!map[schema]) {
    throw new Error(` Schema "${schema}" not found`);
  }

  return map[schema] as z.ZodTypeAny;
};
