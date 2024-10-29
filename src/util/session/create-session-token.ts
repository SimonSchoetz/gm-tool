import { generateToken } from '@/actions/token';
import { createFingerprint } from './create-fingerprint';
import { SessionTokenPayload } from '@/types/actions';
import { getDateFromNowInDuration } from '../helper';
import { DurationLikeObject } from 'luxon';

export const createSessionToken = async (
  userId: string,
  lifeSpan: DurationLikeObject
): Promise<string> => {
  const expiresAt = getDateFromNowInDuration(lifeSpan);
  const fingerprint = createFingerprint();
  return await generateToken<SessionTokenPayload>(
    {
      fingerprint,
      userId,
    },
    expiresAt
  );
};
