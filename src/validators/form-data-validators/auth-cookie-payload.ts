import { zAppUserData } from '@/api/validators';

export const authCookiePayloadValidator = zAppUserData.pick({
  email: true,
  id: true,
});
