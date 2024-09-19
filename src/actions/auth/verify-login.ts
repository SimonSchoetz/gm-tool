'use server';

import { EmailVerificationState, InternalErrorCode } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { LoginData } from '@/types/requests';

import { validatePassword } from '@/util/encryption';
import { getUserByEmail } from '../../api/user/getUser';
import { User } from '@/types/app/user';

export const verifyLogin = async (data: LoginData): Promise<void> => {
  const validated = parseDataWithZodValidator<LoginData>(
    data,
    ValidatorName.LOGIN
  );

  const { email, password } = validated;

  const user = await getUserByEmail(email);

  await checkPassword(password, user.passwordHash);

  checkEmailVerification(user.emailVerified);
};

const checkPassword = async (
  password: string,
  hash: User['passwordHash']
): Promise<void> => {
  const isPasswordValid = await validatePassword(password, hash);

  if (!isPasswordValid) {
    throw new Error(getErrorMessage(InternalErrorCode.PASSWORD_INCORRECT));
  }
};

const checkEmailVerification = (state: EmailVerificationState): void => {
  if (state !== EmailVerificationState.VERIFIED) {
    throw new Error(getErrorMessage(InternalErrorCode.EMAIL_NOT_VERIFIED));
  }
};

const getErrorMessage = (error: InternalErrorCode): string => {
  return `Error during login: ${error}`;
};
