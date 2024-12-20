'use server';

import { dbCreateUser } from '@/api/db/user';
import { HttpStatusCode, Route } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ServerActionResponse, SubmitData } from '@/types/app';
import { ZodError } from 'zod';
import { SignUpFormData } from '@/types/actions';
import { sendEmailVerificationEmail } from '../_util/emails';

export const submitSignUp = async (
  data: SubmitData
): Promise<ServerActionResponse> => {
  try {
    const validatedData = parseDataWithZodValidator<SignUpFormData>(
      data,
      ValidatorName.SIGN_UP
    );

    await dbCreateUser(validatedData);

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
