import { readToken } from '@/actions/token';
import { CookieName, Route } from '@/enums';
import { redirectTo } from '@/util/app';
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

  const sessionCookie = req.cookies.get(CookieName.SESSION);

  if (!sessionCookie) {
    if (isProtectedRoute) {
      return redirectTo(req, Route.LOGIN);
    }
  }

  if (sessionCookie) {
    const canConfirmUser = await confirmToken(sessionCookie.value);
    if (!canConfirmUser) {
      const res = redirectTo(req, Route.LOGIN);
      res.cookies.delete(CookieName.SESSION);

      return res;
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
