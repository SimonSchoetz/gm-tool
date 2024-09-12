'use server';

import { EmailVerificationState, InternalErrorCode } from '@/enums';
import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';
import { LoginData } from '@/types/requests';

import { validatePassword } from '@/util/encryption';
import { getUser } from '../../db/user/getUser';

export const verifyLogin = async (data: LoginData): Promise<void> => {
  const validated = parseDataWithZodSchema<LoginData>(data, SchemaName.LOGIN);

  const { email, password } = validated;

  const user = await getUser(email);

  if (user.email !== EmailVerificationState.VERIFIED) {
    throw new Error(getLoginErrorMessage(InternalErrorCode.EMAIL_NOT_VERIFIED));
  }

  const isPasswordValid = await validatePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error(getLoginErrorMessage(InternalErrorCode.PASSWORD_INCORRECT));
  }
};

const getLoginErrorMessage = (error: InternalErrorCode): string => {
  return `Error during login: ${error}`;
};
