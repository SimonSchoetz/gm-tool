import { Route } from '@/enums';
import { NextRequest, NextResponse } from 'next/server';

const exposedRoutes = ['/login', '/signup', '/'];

export const routeProtection = async (
  req: NextRequest
): Promise<NextResponse<unknown>> => {
  const isExposedRoute = exposedRoutes.includes(req.nextUrl.pathname);

  if (!isExposedRoute) {
    // TODO: Add authentication logic
    const isAuthorized = true;

    const loginRoute = new URL(Route.LOGIN, req.url);

    if (!isAuthorized) {
      return NextResponse.redirect(loginRoute);
    }
  }

  return NextResponse.next();
};
