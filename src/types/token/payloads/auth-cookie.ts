import { User } from '../../user';

export type AuthCookieTokenPayload = {
  email: User['email'];
  userContentId: User['userContentId'];
};
