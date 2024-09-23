'use server';

import { getUserByEmail } from '@/api/db/user';
import { generateToken } from '../token';
import { VerifyEmailTokenPayload } from '@/types/actions/token';
import { EmailResponse } from '@/types/api/email';
import { resendSendEmailVerificationEmail } from '@/api/email/resend-send-email-verification-email';

export const sendEmailVerificationEmail = async (
  userEmail: string
): Promise<EmailResponse> => {
  try {
    const user = await getUserByEmail(userEmail);

    const { email, emailVerified } = user;

    const payload = {
      email,
      verifyEmailHash: emailVerified,
    } satisfies VerifyEmailTokenPayload;

    const emailVerificationToken = await generateToken<VerifyEmailTokenPayload>(
      payload,
      '1day'
    );

    return await resendSendEmailVerificationEmail(
      emailVerificationToken,
      userEmail
    );
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
};
