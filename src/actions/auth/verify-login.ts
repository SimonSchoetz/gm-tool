'use server';

import { EmailVerificationState, ErrorReference } from '@/enums';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { LoginFormData } from '@/types/form-data-dto';

import { validatePassword } from '@/util/encryption';
import { getUserByEmail } from '../../api/db/user/getUser';
import { User } from '@/types/app/user';

export const verifyLogin = async (data: LoginFormData): Promise<void> => {
  const validated = parseDataWithZodValidator<LoginFormData>(
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
    throw new Error(getErrorMessage(ErrorReference.PASSWORD_INCORRECT));
  }
};

const checkEmailVerification = (state: EmailVerificationState): void => {
  if (state !== EmailVerificationState.VERIFIED) {
    throw new Error(getErrorMessage(ErrorReference.EMAIL_NOT_VERIFIED));
  }
};

const getErrorMessage = (error: ErrorReference): string => {
  return `Error during login: ${error}`;
};
