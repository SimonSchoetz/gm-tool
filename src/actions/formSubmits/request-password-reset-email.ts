'use server';

import { FormSubmitResponse } from '@/types/app';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token';
import { parseDataWithZodValidator, ValidatorName } from '@/validators/util';
import { PasswordResetFormEmailData } from '@/types/form-data-dto';
import { HttpStatusCode } from '@/enums';
import { ZodError } from 'zod';
import { sendPasswordResetEmail } from '../emails';

export const submitRequestPasswordResetEmail = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);

    const { email } = parseDataWithZodValidator<PasswordResetFormEmailData>(
      decoded,
      ValidatorName.PASSWORD_RESET_EMAIL
    );

    await sendPasswordResetEmail(email);

    return {
      status: HttpStatusCode.OK,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        return {
          status: HttpStatusCode.CONFLICT,
          error: { email: `We don't recognize this email` },
        };
      }
    }

    throw new Error(`Unknown error during password reset request: "${error}"`); //TODO: save error log in db
  }
};
