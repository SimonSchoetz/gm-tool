'use server';

import { getUserByEmail } from '@/api/db/user';
import { generateToken } from '../token';
import { PasswordResetTokenPayload } from '@/types/actions/token';
import { resendSendPasswordResetEmail } from '@/api/email';
import { ServerActionResponse } from '@/types/app';
import { HttpStatusCode } from '@/enums';

export const sendPasswordResetEmail = async (
  userEmail: string
): Promise<ServerActionResponse> => {
  const user = await getUserByEmail(userEmail);

  if (!user) {
    return {
      status: HttpStatusCode.NOT_FOUND,
      message: 'User not found',
    };
  }

  const payload = { email: user.email } satisfies PasswordResetTokenPayload;

  const restPasswordToken = await generateToken<PasswordResetTokenPayload>(
    payload,
    '1day'
  );

  const res = await resendSendPasswordResetEmail(restPasswordToken, userEmail);

  if (!res.success) {
    return {
      status: HttpStatusCode.BAD_REQUEST,
      message: `Failed to send password reset email: ${res.error}`,
    };
  }

  return {
    status: HttpStatusCode.OK,
  };
};
