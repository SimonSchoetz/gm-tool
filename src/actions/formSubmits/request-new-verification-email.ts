'use server';

import { HttpStatusCode, Route } from '@/enums';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';
import { FormSubmitResponse } from '@/types/responses';
import { ZodError } from 'zod';
import { readToken } from '../token/read-token';
import { assertIsString } from '@/util/asserts';
import { VerificationEmailData } from '@/types/requests';
import { sendEmailVerificationEmail } from '../emails/send-email-verification-email';

export const submitRequestNewVerificationEmail = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);

    const { email } = parseDataWithZodSchema<VerificationEmailData>(
      decoded,
      SchemaName.VERIFICATION_EMAIL
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
