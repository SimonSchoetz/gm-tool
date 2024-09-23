import { z } from 'zod';

import { zAppUserData, zDbUserData, zUserDto } from '@/api/db/validators';
import { AppData, DbData } from './generics';

/**
 * should only be used in api
 */
export type UserDto = z.infer<typeof zUserDto>;

/**
 * should only be used in api
 */
export type AppUserData = AppData<z.infer<typeof zAppUserData>>;

/**
 * should only be used in api
 */
export type DbUserData = DbData<z.infer<typeof zDbUserData>>;
