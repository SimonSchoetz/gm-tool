import { z } from 'zod';
import * as v from '../../form-data-validators';

export const testValidatorZObject = z.object({
  name: z.string(),
  age: z.coerce.number(),
});

export const testValidatorZEffects = z
  .object({
    name: z.string(),
    age: z.coerce.number(),
  })
  .refine((val) => val);

export enum ValidatorName {
  AUTH_COOKIE_PAYLOAD = 'authCookiePayload',
  LOGIN = 'login',
  SIGN_UP = 'signUp',
  TEST_Z_EFFECTS = 'testZEffects',
  TEST_Z_OBJECT = 'testZObject',
  VERIFICATION_EMAIL = 'verificationEmail',
}

export const getValidator = (schema: ValidatorName): z.ZodTypeAny => {
  const map: Record<ValidatorName, z.ZodTypeAny> = {
    [ValidatorName.TEST_Z_OBJECT]: testValidatorZObject,
    [ValidatorName.TEST_Z_EFFECTS]: testValidatorZEffects,
    [ValidatorName.SIGN_UP]: v.signUpValidator,
    [ValidatorName.LOGIN]: v.LoginValidator,
    [ValidatorName.AUTH_COOKIE_PAYLOAD]: v.authCookiePayloadValidator,
    [ValidatorName.VERIFICATION_EMAIL]: v.verificationEmailValidator,
  };

  if (!map[schema]) {
    throw new Error(` Validator "${schema}" not found`);
  }

  return map[schema] as z.ZodTypeAny;
};
