'use server';

import { HttpStatusCode, Route, EmailVerificationState } from '@/enums';
import { ServerActionResponse, SubmitData } from '@/types/app';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ZodError } from 'zod';
import { initSession } from './session';
import { LoginFormData } from '@/types/actions';
import { validatePassword } from '@/util/encryption';
import { getUserByEmail } from '../user';

export const submitLogin = async (
  data: SubmitData
): Promise<ServerActionResponse> => {
  try {
    const { email, password } = parseDataWithZodValidator<LoginFormData>(
      data,
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
