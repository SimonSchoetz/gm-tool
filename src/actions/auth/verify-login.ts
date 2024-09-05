'use server';

import { InternalErrorCode } from '@/enums';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';
import { LoginData } from '@/types/requests';

import { validatePassword } from '@/util/encryption';
import { getUser } from '../../db/user/getUser';

export const verifyLogin = async (data: LoginData): Promise<void> => {
  const validated = parseDataWithZodSchema<LoginData>(data, SchemaName.LOGIN);

  const { email, password } = validated;

  const user = await getUser(email);

  const isPasswordValid = await validatePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error(
      `Error during login: ${InternalErrorCode.PASSWORD_INCORRECT}`
    );
  }
};
