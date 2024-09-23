import { z } from 'zod';

import {
  zCreateUserDto,
  zAppUserData,
  zDbUserData,
  zUserDto,
} from '@/api/db/validators';
import { AppData, DbData } from './generics';

export type UserDto = z.infer<typeof zUserDto>;

export type AppUserData = AppData<z.infer<typeof zAppUserData>>;

export type DbUserData = DbData<z.infer<typeof zDbUserData>>;

export type CreateUserDto = z.infer<typeof zCreateUserDto>;
