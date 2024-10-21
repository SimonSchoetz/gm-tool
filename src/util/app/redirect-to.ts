import { Route } from '@/enums';
import { NextRequest, NextResponse } from 'next/server';

export const redirectTo = (
  req: NextRequest,
  route: Route
): NextResponse<unknown> => {
  const { pathname } = req.nextUrl;

  if (pathname === route) {
    return NextResponse.next();
  }

  const url = new URL(route, req.url);
  return NextResponse.redirect(url);
};
