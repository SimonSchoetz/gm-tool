'use server';

import { createUser } from '@/api/db/user';
import { HttpStatusCode, Route } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { FormSubmitResponse } from '@/types/app';
import { ZodError } from 'zod';
import { readToken } from '../token/read-token';
import { assertIsString } from '@/util/asserts';
import { SignUpFormData } from '@/types/form-data-dto';
import { sendEmailVerificationEmail } from '../emails';

export const submitSignUp = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);
    const validatedData = parseDataWithZodValidator<SignUpFormData>(
      decoded,
      ValidatorName.SIGN_UP
    );

    await createUser(validatedData);

    sendEmailVerificationEmail(validatedData.email);

    return {
      status: HttpStatusCode.CREATED,
      redirectRoute: Route.VERIFY_EMAIL,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
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

    throw new Error(`Unknown error during sign up: "${error}"`); //TODO: save error log in db
  }
};
