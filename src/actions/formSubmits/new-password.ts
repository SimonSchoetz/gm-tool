'use server';

import { HttpStatusCode, ErrorReference, Route } from '@/enums';
import { NewPasswordFormData } from '@/types/actions';
import { FormSubmitResponse } from '@/types/app';
import { assertIsString } from '@/util/asserts';
import { readToken } from '../token';
import { parseDataWithZodValidator, ValidatorName } from '@/validators/util';
import { getUserByEmail, updateUser } from '@/api/db/user';
import { ZodError } from 'zod';
import { encryptPassword } from '@/util/encryption';

export const submitNewPassword = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    assertIsString(data);
    const decoded = await readToken(data);

    const { token, password } = parseDataWithZodValidator<NewPasswordFormData>(
      decoded,
      ValidatorName.NEW_PASSWORD
    );
    assertIsString(token);
    const { email } = await readToken(token);
    assertIsString(email);

    const { id } = await getUserByEmail(email);

    await updateUser(id, { passwordHash: await encryptPassword(password) });

    return {
      status: HttpStatusCode.OK,
      redirectRoute: Route.LOGIN,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        throw new Error(`Error: ${ErrorReference.USER_NOT_FOUND}`);
      }
    }

    throw new Error(`Unknown error during sign up: "${error}"`); //TODO: save error log in db
  }
};
