'use server';

import { getUserByEmail } from '@/api/user';
import { generateToken } from '../token';
import { VerifyEmailTokenPayload } from '@/types/actions/token';
import { sendEmail } from './send-email';
import { EmailSender } from '@/enums';
import { VerifyEmailTemplate } from '@/components/emails/auth';
import { EmailData } from '@/types/actions/email';

export const sendEmailVerificationEmail = async (
  userEmail: string
): Promise<void> => {
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

    sendEmail(getEmailConfig(emailVerificationToken, userEmail));
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
};

const getEmailConfig = (token: string, email: string): EmailData => {
  return {
    from: EmailSender.NO_REPLY,
    to: email,
    subject: 'GM-Tool: Please verify your email',
    template: VerifyEmailTemplate({ token }),
  };
};
