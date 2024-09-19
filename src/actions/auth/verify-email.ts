'use server';

import { getUserByEmail, updateUser } from '@/api/user';
import { readToken } from '../token';
import { EmailVerificationState } from '@/enums';
import { VerifyEmailTokenPayload } from '@/types/actions';

export const verifyEmail = async (
  token: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const { email, verifyEmailHash } =
      await readToken<VerifyEmailTokenPayload>(token);

    const { emailVerified, id } = await getUserByEmail(email);

    if (verifyEmailHash === emailVerified) {
      updateUser(id, {
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
