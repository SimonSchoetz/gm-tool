import { readToken } from '@/actions/token';
import { CookieName, Route } from '@/enums';
import { redirectTo } from '@/util/router';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const authRoutes = [
  Route.LOGIN,
  Route.SIGN_UP,
  Route.VERIFY_EMAIL,
  Route.PASSWORD_RESET,
];
const unprotectedRoutes = [...authRoutes, Route.HOME];

export const routeProtection = async (
  req: NextRequest
): Promise<NextResponse<unknown>> => {
  const pathname = req.nextUrl.pathname as Route;

  const isProtectedRoute = !unprotectedRoutes.includes(pathname);
  const isUnknownRoute = !Object.values(Route).includes(pathname);

  if (isUnknownRoute) {
    return NextResponse.rewrite(new URL(Route.NOT_FOUND, req.url));
  }

  const authCookie = cookies().get(CookieName.AUTH);

  if (!authCookie) {
    if (isProtectedRoute) {
      return redirectTo(req, Route.LOGIN);
    }
  }

  if (authCookie) {
    const canConfirmUser = await confirmToken(authCookie.value);
    if (!canConfirmUser) {
      /**
       * My first plan was to delete the faulty cookie but this is not so easily handled,
       * hence just the redirect to the login which can overwrite the cookie on success
       */
      return redirectTo(req, Route.LOGIN);
    }

    if (authRoutes.includes(pathname)) {
      return redirectTo(req, Route.HOME);
    }
  }

  return NextResponse.next();
};

const confirmToken = async (token: string): Promise<boolean> => {
  try {
    await readToken(token);
    return true;
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid token') {
      return false;
    }
    throw err;
  }
};
