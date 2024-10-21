import { HttpStatusCode } from '@/enums';
import { NextRequest, NextResponse } from 'next/server';
import * as mw from './middlewares';

const middleWareFunctionList = [mw.routeProtection, mw.csrfProtection];

const composeMiddleware = (
  middlewares: Array<(req: NextRequest) => NextResponse | Promise<NextResponse>>
): ((req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    for (const middleware of middlewares) {
      const response = await middleware(req);
      if (response && response.status !== HttpStatusCode.OK) {
        return response;
      }
    }
    return NextResponse.next();
  };
};

const middlewares = composeMiddleware(middleWareFunctionList);

export default function middleware(req: NextRequest) {
  return middlewares(req);
}

export const config = {
  matcher: ['/((?!_next).*)'],
};
