import { CookieName } from '@/enums';
import { cookies } from 'next/headers';

export const getSignature = async (): Promise<string> => {
  return (await cookies()).get(CookieName.SESSION_SIGNATURE)?.value ?? '';
};
