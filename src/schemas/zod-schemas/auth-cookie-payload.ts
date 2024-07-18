import { UserSchema } from './user';

export const AuthCookiePayloadSchema = UserSchema.pick({
  email: true,
  userContentId: true,
});
