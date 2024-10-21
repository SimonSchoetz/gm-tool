'use server';

import { HttpStatusCode, Route, CookieName } from '@/enums';
import { FormSubmitResponse } from '@/types/app';
import { deleteCookie } from '../cookies';

export const submitLogout = async (
  data: unknown
): Promise<FormSubmitResponse> => {
  try {
    deleteCookie(CookieName.SESSION);
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
