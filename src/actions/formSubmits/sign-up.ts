'use server';

import { createUser } from '@/api/db/user';
import { HttpStatusCode, Route } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ServerActionResponse } from '@/types/app';
import { ZodError } from 'zod';
import { readToken } from '../token/read-token';
import { assertIsString } from '@/util/asserts';
import { SignUpFormData } from '@/types/actions';
import { sendEmailVerificationEmail } from '../emails';

export const submitSignUp = async (
  data: unknown
): Promise<ServerActionResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);
    const validatedData = parseDataWithZodValidator<SignUpFormData>(
      decoded,
      ValidatorName.SIGN_UP
    );

    await createUser(validatedData);

    await sendEmailVerificationEmail(validatedData.email);

    return {
      status: HttpStatusCode.CREATED,
      redirectRoute: Route.VERIFY_EMAIL,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: HttpStatusCode.BAD_REQUEST,
        message: 'Could not validate input data',
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('Email already in use.')) {
        return {
          status: HttpStatusCode.CONFLICT,
          error: {
            email: 'Email already in use.',
          },
        };
      }
    }

    return {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: `Unknown error during sign up: "${error}"`,
    };
  }
};
