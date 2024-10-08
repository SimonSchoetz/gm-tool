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
    optionalField: z.number().optional(),
  })
  .refine((val) => val);

export enum ValidatorName {
  LOGIN = 'login',
  NEW_PASSWORD = 'newPassword',
  PASSWORD_RESET_EMAIL = 'passwordResetEmail',
  SIGN_UP = 'signUp',
  TEST_Z_EFFECTS = 'testZEffects',
  TEST_Z_OBJECT = 'testZObject',
  VERIFICATION_EMAIL = 'verificationEmail',
}
/**
 * not to myself: Yeah it seems a bit over-engineered but this is
 * the only way I saw for now to make it work with the form-wrapper
 */
export const getFormDataValidator = (schema: ValidatorName): z.ZodTypeAny => {
  const map: Record<ValidatorName, z.ZodTypeAny> = {
    [ValidatorName.TEST_Z_OBJECT]: testValidatorZObject,
    [ValidatorName.TEST_Z_EFFECTS]: testValidatorZEffects,
    [ValidatorName.SIGN_UP]: v.signUpValidator,
    [ValidatorName.LOGIN]: v.LoginValidator,
    [ValidatorName.VERIFICATION_EMAIL]: v.verificationEmailValidator,
    [ValidatorName.PASSWORD_RESET_EMAIL]: v.passwordResetEmailValidator,
    [ValidatorName.NEW_PASSWORD]: v.newPasswordValidator,
  };

  if (!map[schema]) {
    throw new Error(`Validator "${schema}" not found`);
  }

  return map[schema] as z.ZodTypeAny;
};
