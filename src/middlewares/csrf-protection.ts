// based on this article: https://lucia-auth.com/sessions/cookies/nextjs

import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export const csrfProtection = async (
  req: NextRequest
): Promise<NextResponse<unknown>> => {
  if (req.method !== 'GET') {
    const originHeader = req.headers.get('Origin');
    const hostHeader =
      req.headers.get('host') || req.headers.get('x-forwarded-host');

    const errorRes = new NextResponse(null, {
      status: 403,
    });

    if (originHeader === null || hostHeader === null) {
      return errorRes;
    }

    let origin: URL;
    try {
      origin = new URL(originHeader);
    } catch {
      return errorRes;
    }

    if (origin.host !== hostHeader) {
      return errorRes;
    }
  }
  return NextResponse.next();
};
