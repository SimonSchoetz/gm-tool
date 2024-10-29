'use server';

import { dbDeleteSession } from '@/api/db/session';
import { ServerActionResponse } from '@/types/app';

export const deleteSession = async (
  sessionId: string
): Promise<ServerActionResponse> => {
  return await dbDeleteSession(sessionId);
};
