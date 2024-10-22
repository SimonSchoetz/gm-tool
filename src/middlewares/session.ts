import { NextRequest, NextResponse } from 'next/server';

export const session = (
  req: NextRequest
): NextResponse | Promise<NextResponse> => {
  /**
   * check session cookie expiration
   * check token within cookie expiration
   * - if any is about to expire (cookie less than 15min, token less than 1h)
   * -- check saved fingerprint with current fingerprint
   * -- if they match
   * -- refresh cookie and/or token
   * -- if they don't match, logout user
   */
  return NextResponse.next();
};
