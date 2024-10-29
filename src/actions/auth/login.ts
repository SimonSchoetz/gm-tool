'use server';

import { HttpStatusCode, Route, EmailVerificationState } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ZodError } from 'zod';
import { initSession } from './session';
import { LoginFormData } from '@/types/actions';
import { validatePassword } from '@/util/encryption';
import { getUserByEmail } from '../user';

export const submitLogin = async (
  data: unknown
): Promise<ServerActionResponse> => {
  try {
    assertIsString(data);

    const decoded = await readToken(data);

    const { email, password } = parseDataWithZodValidator<LoginFormData>(
      decoded,
      ValidatorName.LOGIN
    );

    const user = await getUserByEmail(email);

    if (!user) {
      return {
        status: HttpStatusCode.UNAUTHORIZED,
        error: {
          email: 'User does not exist',
        },
      };
    }
    const isPasswordValid = await validatePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        status: HttpStatusCode.UNAUTHORIZED,
        error: {
          password: 'Password incorrect',
        },
      };
    }

    if (user.emailVerified !== EmailVerificationState.VERIFIED) {
      return {
        status: HttpStatusCode.UNAUTHORIZED,
        redirectRoute: Route.VERIFY_EMAIL,
      };
    }

    await initSession(user);

    return {
      status: HttpStatusCode.ACCEPTED,
      redirectRoute: Route.HOME,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    throw error;
  }

  // revalidatePath('/login'); thats just an example for when I want to show up added elements
};
