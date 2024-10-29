import { generateToken, readToken } from '@/actions/token';
import { CookieName, Route } from '@/enums';
import { LocalSessionTokenPayload, SessionTokenPayload } from '@/types/actions';
import { getCookieConfig, getDateFromNowInDuration } from '@/util/helper';
import { NextRequest, NextResponse } from 'next/server';

import { createFingerprint } from '@/util/session';
import { redirectTo } from '@/util/app';
import { deleteSession, getSessionById } from '@/actions/session';
import { zAppSessionData } from '@/api/db/validators';
import { AppSessionData } from '@/types/api/db';
import { bumpSession } from '@/actions/auth/session';

export const session = async (
  req: NextRequest
): Promise<NextResponse<unknown>> => {
  const sessionCookie = req.cookies.get(CookieName.SESSION);

  if (!sessionCookie) {
    return NextResponse.next();
  }

  const localSession = await readToken<LocalSessionTokenPayload>(
    sessionCookie.value
  );

  const sessionIsOlderThan15Minutes =
    localSession.createdAt < getDateFromNowInDuration({ minutes: -15 });

  if (sessionIsOlderThan15Minutes) {
    return await tryRefreshSessionOrLogout(req, localSession);
  }

  return NextResponse.next();
};

const tryRefreshSessionOrLogout = async (
  req: NextRequest,
  localSession: LocalSessionTokenPayload
): Promise<NextResponse<unknown>> => {
  const dbSession = await getSessionById(localSession.sessionId);

  try {
    assertIsSessionData(dbSession);

    const decodedToken = await readToken<SessionTokenPayload>(
      dbSession.sessionToken
    );

    assertIsSameFingerprint(decodedToken.fingerprint);

    if (expiresInLessThanXHours(decodedToken.expiresAt, 2)) {
      await bumpSession(dbSession.id, dbSession.userId);
      return await getResponse(req.url, dbSession.id, 4);
    }

    if (!expiresInLessThanXHours(decodedToken.expiresAt, 24)) {
      return await getResponse(req.url, dbSession.id, 24);
    }
  } catch {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
    return removeLocalSession(req);
  }

  return NextResponse.next();
};

const assertIsSameFingerprint = (fingerprint: string): void => {
  if (fingerprint !== createFingerprint()) {
    throw new Error();
  }
};

const assertIsSessionData: (
  sessionData: unknown
) => asserts sessionData is AppSessionData = (sessionData) => {
  zAppSessionData.parse(sessionData);
};

const removeLocalSession = (req: NextRequest): NextResponse<unknown> => {
  const res = redirectTo(req, Route.LOGIN);
  res.cookies.delete(CookieName.SESSION);
  return res;
};

const expiresInLessThanXHours = (date: Date, hours: number): boolean => {
  return date < getDateFromNowInDuration({ hours });
};

const generateLocalSessionToken = async (
  sessionId: string,
  hours: number
): Promise<string> =>
  await generateToken<LocalSessionTokenPayload>(
    { sessionId },
    getDateFromNowInDuration({ hours })
  );

const getResponse = async (
  url: string,
  sessionId: string,
  hours: number
): Promise<NextResponse<unknown>> => {
  const res = NextResponse.redirect(url);
  res.cookies.set(
    CookieName.SESSION,
    await generateLocalSessionToken(sessionId, hours),
    getCookieConfig(getDateFromNowInDuration({ hours }))
  );

  return res;
};
