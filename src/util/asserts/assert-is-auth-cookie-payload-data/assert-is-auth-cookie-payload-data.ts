import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';
import { AuthCookiePayload } from '@/types/cookies';

export const assertIsAuthCookiePayload: (
  data: unknown
) => asserts data is AuthCookiePayload = (data) => {
  const isAuthCookiePayloadData = parseDataWithZodSchema(
    data,
    SchemaName.AUTH_COOKIE_PAYLOAD
  );

  if (!isAuthCookiePayloadData) {
    throw new Error(`Expected user data, got: ${data}`);
  }
};
