'use server';

import { ServerActionResponse } from '@/types/app';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token';
import { parseDataWithZodValidator, ValidatorName } from '@/validators/util';
import { PasswordResetFormEmailData } from '@/types/actions';
import { HttpStatusCode } from '@/enums';
import { ZodError } from 'zod';
import { sendPasswordResetEmail } from '../emails';

export const submitRequestPasswordResetEmail = async (
  data: unknown
): Promise<ServerActionResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);

    const { email } = parseDataWithZodValidator<PasswordResetFormEmailData>(
      decoded,
      ValidatorName.PASSWORD_RESET_EMAIL
    );

    const res = await sendPasswordResetEmail(email);

    if (res.status !== HttpStatusCode.OK) {
      return res;
    }

    return {
      status: HttpStatusCode.OK,
      message: 'Check your email!',
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: HttpStatusCode.BAD_REQUEST,
        message: 'Could not validate input data',
      };
    }

    return {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: `Unknown error during password reset request: "${error}"`,
    };
  }
};
