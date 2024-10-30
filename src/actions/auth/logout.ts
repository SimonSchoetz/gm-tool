'use server';

import { HttpStatusCode, Route, CookieName } from '@/enums';
import { ServerActionResponse } from '@/types/app';
import { deleteCookie } from '../cookies';
import { deleteSession } from '../session';
import { getLocalSession } from '@/util/session';

export const submitLogout = async (): Promise<ServerActionResponse> => {
  try {
    const localSession = await getLocalSession();
    await deleteSession(localSession!.sessionId);

    await deleteCookie(CookieName.SESSION);

    return {
      status: HttpStatusCode.ACCEPTED,
      redirectRoute: Route.HOME,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw Error(error.message);
    }
    throw new Error(`Unknown error during logout`);
  }
};
