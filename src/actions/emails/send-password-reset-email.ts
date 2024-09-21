'server only';

import { getUserByEmail } from '@/api/user';
import { generateToken } from '../token';
import { PasswordResetTokenPayload } from '@/types/actions/token';
import { sendEmail } from './send-email';
import { EmailSender } from '@/enums';
import { EmailData } from '@/types/actions/email';
import { PasswordResetTemplate } from '@/components/emails/auth';

export const sendPasswordResetEmail = async (
  userEmail: string
): Promise<void> => {
  try {
    const user = await getUserByEmail(userEmail);

    const { email } = user;

    const payload = { email } satisfies PasswordResetTokenPayload;

    const restPasswordToken = await generateToken<PasswordResetTokenPayload>(
      payload,
      '1day'
    );

    sendEmail(getEmailConfig(restPasswordToken, userEmail));
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
    subject: 'GM-Tool: Password reset',
    template: PasswordResetTemplate({ token }),
  };
};
