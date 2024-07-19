import { CookieName, Route } from '@/enums';
import { redirectTo } from '@/util/router';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const authRoutes = [Route.LOGIN, Route.SIGN_UP];
const unprotectedRoutes = [...authRoutes, Route.HOME];

export const routeProtection = (req: NextRequest): NextResponse<unknown> => {
  const pathname = req.nextUrl.pathname as Route;

  const isProtectedRoute = !unprotectedRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isAuthorized = cookies().get(CookieName.AUTH);

  if (isAuthRoute && isAuthorized) {
    return redirectTo(req, Route.HOME);
  }

  if (isProtectedRoute && !isAuthorized) {
    return redirectTo(req, Route.LOGIN);
  }

  return NextResponse.next();
};
