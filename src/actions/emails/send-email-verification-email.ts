'server only';

import { getUser } from '@/db/user';
import { generateToken } from '../token';
import { VerifyEmailTokenPayload } from '@/types/token/payloads';
import { EmailData, sendEmail } from './send-email';
import { EmailSender } from '@/enums';
import { VerifyEmail } from '@/components/emails/auth';
import { assertIsZodSchemaBasedType } from '@/util/asserts';
import { User } from '@/types/user';
import { SchemaName } from '@/schemas/util';

export const sendEmailVerificationEmail = async (
  userEmail: string
): Promise<void> => {
  try {
    const user = await getUser(userEmail);

    assertIsZodSchemaBasedType<User>(user, SchemaName.USER);

    const { email, emailVerified } = user;

    const payload = { email, verifyEmailHash: emailVerified };
    const emailVerificationToken = await generateToken<VerifyEmailTokenPayload>(
      payload,
      '15min'
    );

    sendEmail(getVerifyEmailData(emailVerificationToken, userEmail));
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
};

const getVerifyEmailData = (token: string, email: string): EmailData => {
  return {
    from: EmailSender.NO_REPLY,
    to: email,
    subject: 'GM-Tool: Please verify your email',
    template: VerifyEmail({ token }),
  };
};
