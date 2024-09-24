'use server';

import { HttpStatusCode, Route } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { FormSubmitResponse } from '@/types/app';
import { ZodError } from 'zod';
import { readToken } from '../token/read-token';
import { assertIsString } from '@/util/asserts';
import { VerificationEmailFormData } from '@/types/actions';
import { sendEmailVerificationEmail } from '../emails';

export const submitRequestNewVerificationEmail = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);

    const { email } = parseDataWithZodValidator<VerificationEmailFormData>(
      decoded,
      ValidatorName.VERIFICATION_EMAIL
    );

    await sendEmailVerificationEmail(email);

    return {
      status: HttpStatusCode.OK,
      redirectRoute: Route.VERIFY_EMAIL,
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

    throw new Error(
      `Unknown error during verification email request: "${error}"`
    ); //TODO: save error log in db
  }
};
