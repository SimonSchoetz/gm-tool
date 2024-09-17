import { z } from 'zod';
import { zUserDto } from '../validators';
import { AppData, DbData } from './generics';

export type UserDto = z.infer<typeof zUserDto>;

export type AppUserData = AppData<UserDto>;

export type DbUserData = DbData<UserDto>;
