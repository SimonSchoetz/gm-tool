'server-only';

import { getUserByEmail } from '../../user';
import { generateAuthToken } from '../../token';
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

  const restPasswordToken = await generateAuthToken<PasswordResetTokenPayload>(
    payload,
    '30days',
    'AUTH_TOKEN_SECRET'
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
