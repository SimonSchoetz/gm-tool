'use server';

import {
  HttpStatusCode,
  Route,
  EmailVerificationState,
  CookieName,
} from '@/enums';
import { ServerActionResponse, SubmitData } from '@/types/app';
import { ValidatorName, parseDataWithZodValidator } from '@/validators/util';
import { ZodError } from 'zod';
import { LocalSessionTokenPayload, LoginFormData } from '@/types/actions';
import { validatePassword } from '@/util/encryption';
import { getUserByEmail } from '../user';
import { dbCreateSession } from '@/api/db/session';
import { User } from '@/types/app/user';
import { DurationLikeObject } from 'luxon';
import { getDateFromNowInDuration } from '@/util/helper';
import { generateToken } from '../token';
import { setCookie } from '../cookies';

export const submitLogin = async (
  data: SubmitData
): Promise<ServerActionResponse> => {
  try {
    const { email, password } = parseDataWithZodValidator<LoginFormData>(
      data,
      ValidatorName.LOGIN
    );

    const user = await getUserByEmail(email);

    if (!user) {
      return {
        status: HttpStatusCode.UNAUTHORIZED,
        error: {
          email: 'User does not exist',
        },
      };
    }
    const isPasswordValid = await validatePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return {
        status: HttpStatusCode.UNAUTHORIZED,
        error: {
          password: 'Password incorrect',
        },
      };
    }

    if (user.emailVerified !== EmailVerificationState.VERIFIED) {
      return {
        status: HttpStatusCode.UNAUTHORIZED,
        redirectRoute: Route.VERIFY_EMAIL,
      };
    }

    await initSession(user);

    return {
      status: HttpStatusCode.ACCEPTED,
      redirectRoute: Route.HOME,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error('Could not validate input data');
    }

    throw error;
  }
};

const initSession = async (user: User): Promise<ServerActionResponse> => {
  const { sessionId } = await dbCreateSession({
    userId: user.id,
  });

  await setLocalSession(sessionId, { hours: 24 });

  return {
    status: HttpStatusCode.OK,
  };
};

const setLocalSession = async (
  sessionId: string,
  lifeSpan: DurationLikeObject
): Promise<void> => {
  const expiresAt = getDateFromNowInDuration(lifeSpan);

  const localSessionToken = await generateToken<LocalSessionTokenPayload>(
    { sessionId },
    expiresAt
  );

  await setCookie(CookieName.AUTH_SESSION, localSessionToken, expiresAt);
};
