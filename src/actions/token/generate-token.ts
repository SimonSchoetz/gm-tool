'use server';

import { assertIsString } from '@/util/asserts';
import { parsedEnv } from '@/util/helper';
import jwt from 'jsonwebtoken';

export type TokenPayload = string | object | Buffer;

export const generateToken = async (
  payload: TokenPayload,
  lifeSpan: string // format '100' for 100ms, '1s' for 1 second, [s|m|h|d|y]
): Promise<string> => {
  const secret = parsedEnv.JWT_AUTH_SECRET;
  assertIsString(secret);
  return jwt.sign(payload, secret, { expiresIn: lifeSpan });
};
