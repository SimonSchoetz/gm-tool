'use server';
import jwt from 'jsonwebtoken';
import { assertIsString } from '@/util/asserts';

export const readToken = async (token: string): Promise<unknown> => {
  try {
    const secret = process.env.JWT_SECRET;
    assertIsString(secret);
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
