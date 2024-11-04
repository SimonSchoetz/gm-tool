'use server';

import { HttpStatusCode, Route } from '@/enums';
import { NewPasswordFormData } from '@/types/actions';
import { ServerActionResponse, SubmitData } from '@/types/app';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token';
import { parseDataWithZodValidator, ValidatorName } from '@/validators/util';
import { dbUpdateUser } from '@/api/db/user';
import { ZodError } from 'zod';
import { encryptPassword } from '@/util/encryption';
import { getUserByEmail } from '../user';

export const submitNewPassword = async (
  data: SubmitData
): Promise<ServerActionResponse> => {
  try {
    const { token, password } = parseDataWithZodValidator<NewPasswordFormData>(
      data,
      ValidatorName.NEW_PASSWORD
    );
    assertIsString(token);
    const { email } = await readToken(token, 'AUTH_TOKEN_SECRET');
    assertIsString(email);

    const user = await getUserByEmail(email);

    if (!user) {
      return {
        status: HttpStatusCode.NOT_FOUND,
        error: { message: 'User not found' },
      };
    }

    await dbUpdateUser(user.id, {
      passwordHash: await encryptPassword(password),
    });

    return {
      status: HttpStatusCode.OK,
      redirectRoute: Route.LOGIN,
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
      message: `Unknown error during new password: "${error}"`,
    };
  }
};
