import { dbUpdateSession } from '@/api/db/session';
import { HttpStatusCode } from '@/enums';
import { createSessionToken } from '@/util/session';

export const bumpSession = async (
  sessionId: string,
  userId: string
): Promise<{ status: HttpStatusCode }> => {
  return await dbUpdateSession(sessionId, {
    sessionToken: await createSessionToken(userId, { hours: 6 }),
  });
};
