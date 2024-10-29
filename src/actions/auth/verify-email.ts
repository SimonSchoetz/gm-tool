'use server';

import { dbUpdateUser } from '@/api/db/user';
import { readToken } from '../token';
import { EmailVerificationState, HttpStatusCode } from '@/enums';
import { VerifyEmailTokenPayload } from '@/types/actions';
import { ServerActionResponse } from '@/types/app';
import { getUserByEmail } from '../user';

export const verifyEmail = async (
  token: string
): Promise<ServerActionResponse> => {
  try {
    const { email, verifyEmailHash } =
      await readToken<VerifyEmailTokenPayload>(token);

    const user = await getUserByEmail(email);

    if (!user) {
      return {
        status: HttpStatusCode.NOT_FOUND,
        message: 'User does not exist',
      };
    }

    if (verifyEmailHash !== user.emailVerified) {
      return {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Faulty verification',
      };
    }

    return await dbUpdateUser(user.id, {
      emailVerified: EmailVerificationState.VERIFIED,
    });
  } catch (error) {
    if (error instanceof Error) {
      const { message } = error;
      if (message.includes('expired')) {
        return { status: HttpStatusCode.BAD_REQUEST, message: 'Token expired' };
      }

      return {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: `Unknown error: ${error.message}`,
      };
    }

    throw error;
  }
};
