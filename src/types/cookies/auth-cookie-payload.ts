import { User } from '../user';

export type AuthCookiePayload = {
  email: User['email'];
  userContentId: User['userContentId'];
};
