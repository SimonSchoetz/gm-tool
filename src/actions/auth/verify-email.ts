'use server';

import { getUser, updateUser } from '@/db/user';
import { readToken } from '../token';
import { VerifyEmailTokenPayload } from '@/types/token/payloads';
import { EmailVerificationState } from '@/enums';

export const verifyEmail = async (
  token: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const { email, verifyEmailHash } = await readToken<VerifyEmailTokenPayload>(
      token
    );
    const { emailVerified } = await getUser(email);

    if (verifyEmailHash === emailVerified) {
      updateUser(email, {
        emailVerified: EmailVerificationState.VERIFIED,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      const { message } = error;
      if (message.includes('expired')) {
        return { success: false, message: 'Token expired' };
      }

      return { success: false, message: `Unknown error: ${error.message}` };
    }

    throw error;
  }
};
