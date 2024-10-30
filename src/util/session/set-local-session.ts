'use server';

import { setCookie } from '@/actions/cookies';
import { generateToken } from '@/actions/token';
import { CookieName } from '@/enums';
import { LocalSessionTokenPayload } from '@/types/actions';
import { getDateFromNowInDuration } from '@/util/helper';
import { DurationLikeObject } from 'luxon';

export const setLocalSession = async (
  sessionId: string,
  lifeSpan: DurationLikeObject
): Promise<void> => {
  const expiresAt = getDateFromNowInDuration(lifeSpan);

  const localSessionToken = await generateToken<LocalSessionTokenPayload>(
    { sessionId },
    expiresAt
  );

  await setCookie(CookieName.SESSION, localSessionToken, expiresAt);
};
