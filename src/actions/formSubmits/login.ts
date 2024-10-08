'use server';

import { HttpStatusCode, ErrorReference, Route } from '@/enums';
import { FormSubmitResponse } from '@/types/app';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token/read-token';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ZodError } from 'zod';
import { verifyLogin } from '../auth';
import { setAuthCookie } from '../cookies';
import { getUserByEmail } from '@/api/db/user';
import { LoginFormData } from '@/types/actions/form-data-dto';

export const submitLogin = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);

    const decoded = await readToken(data);

    const validatedData = parseDataWithZodValidator<LoginFormData>(
      decoded,
      ValidatorName.LOGIN
    );

    await verifyLogin(validatedData);

    const user = await getUserByEmail(validatedData.email);

    await setAuthCookie(user);

    return {
      status: HttpStatusCode.ACCEPTED,
      redirectRoute: Route.HOME,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    if (error instanceof Error) {
      if (error.message.includes(ErrorReference.EMAIL_NOT_VERIFIED)) {
        return {
          status: HttpStatusCode.UNAUTHORIZED,
          redirectRoute: Route.VERIFY_EMAIL,
        };
      }
      if (isLoginError(error.message)) {
        return {
          status: HttpStatusCode.UNAUTHORIZED,
          error: {
            password: 'Email or password incorrect',
          },
        };
      }

      throw new Error(error.message);
    }

    throw new Error(`Unknown error during login`); //TODO: save error log in db
  }

  // revalidatePath('/login'); thats just an example for when I want to show up added elements
  // in a list so it gets cached again
};

const isLoginError = (error: string): boolean => {
  return (
    error.includes(ErrorReference.PASSWORD_INCORRECT) ||
    error.includes(ErrorReference.USER_NOT_FOUND)
  );
};
