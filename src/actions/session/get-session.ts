'use server';

import { dbGetSessionById } from '@/api/db/session';
import { AppSessionData } from '@/types/api/db/session';

export const getSessionById = async (
  id: string
): Promise<AppSessionData | null> => {
  return await dbGetSessionById(id);
};
