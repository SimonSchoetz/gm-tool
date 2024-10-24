'use server';

import { dbGetUserById } from '@/api/db/user';
import { User } from '@/types/app/user';

import { cache } from 'react';

export const getUserById = cache(
  async (userId: User['id']): Promise<User | null> => {
    return await dbGetUserById(userId);
  }
);
