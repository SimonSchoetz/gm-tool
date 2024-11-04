import { readToken } from '@/actions/token';
import { z } from 'zod';

export const signature = z.string();

export const verifySignature = async (signature: string) => {
  await readToken(signature, 'SESSION_SIGNATURE_SECRET');
};
