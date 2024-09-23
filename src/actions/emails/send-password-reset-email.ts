'use server';

import { getUserByEmail } from '@/api/db/user';
import { generateToken } from '../token';
import { PasswordResetTokenPayload } from '@/types/actions/token';
import { resendSendPasswordResetEmail } from '@/api/email';
import { EmailResponse } from '@/types/api/email';

export const sendPasswordResetEmail = async (
  userEmail: string
): Promise<EmailResponse> => {
  try {
    const user = await getUserByEmail(userEmail);

    const { email } = user;

    const payload = { email } satisfies PasswordResetTokenPayload;

    const restPasswordToken = await generateToken<PasswordResetTokenPayload>(
      payload,
      '1day'
    );

    return await resendSendPasswordResetEmail(restPasswordToken, userEmail);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
};
