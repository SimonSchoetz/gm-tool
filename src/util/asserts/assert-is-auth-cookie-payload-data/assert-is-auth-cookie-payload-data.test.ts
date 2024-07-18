import { AuthCookiePayload } from '@/types/cookies';
import { assertIsAuthCookiePayload } from './assert-is-auth-cookie-payload-data';

export const authCookiePayloadTestData: AuthCookiePayload = {
  email: 'test',
  userContentId: 'test',
};

describe('assertIsUserData', () => {
  it('should throw an error if input is not of type AuthCookyPayload', () => {
    const authCookiePayload = {};

    expect(() => assertIsAuthCookiePayload(authCookiePayload)).toThrow();
  });

  it('should throw not an error if input is not of type AuthCookyPayload', () => {
    expect(() =>
      assertIsAuthCookiePayload(authCookiePayloadTestData)
    ).not.toThrow();
  });
});
