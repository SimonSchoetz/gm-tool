'server-only';

import { getUserByEmail } from '../../user';
import { generateAuthToken } from '../../token';
import { VerifyEmailTokenPayload } from '@/types/actions/token';
import { resendSendEmailVerificationEmail } from '@/api/email';
import { ServerActionResponse } from '@/types/app';
import { HttpStatusCode } from '@/enums';

export const sendEmailVerificationEmail = async (
  userEmail: string
): Promise<ServerActionResponse> => {
  const user = await getUserByEmail(userEmail);

  if (!user) {
    return {
      status: HttpStatusCode.NOT_FOUND,
      error: { message: 'User not found' },
    };
  }

  const { email } = user;

  const payload = {
    email,
  } satisfies VerifyEmailTokenPayload;

  const emailVerificationToken =
    await generateAuthToken<VerifyEmailTokenPayload>(
      payload,
      '30days',
      'AUTH_TOKEN_SECRET'
    );

  const res = await resendSendEmailVerificationEmail(
    emailVerificationToken,
    userEmail
  );

  if (!res.success) {
    return {
      status: HttpStatusCode.BAD_REQUEST,
      message: `Failed to send email verification email: ${res.error}`,
    };
  }

  return {
    status: HttpStatusCode.OK,
  };
};
