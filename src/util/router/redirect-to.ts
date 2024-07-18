import { Route } from '@/enums';
import { NextRequest, NextResponse } from 'next/server';

export const redirectTo = (
  req: NextRequest,
  route: Route
): NextResponse<unknown> => {
  const url = new URL(route, req.url);
  return NextResponse.redirect(url);
};
