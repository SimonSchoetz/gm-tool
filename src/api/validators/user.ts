import { EmailVerificationState } from '@/enums';
import { z } from 'zod';
import { zMapAppToDbData, zMapDbToAppData } from './util';

export const zUserDto = z.object({
  email: z.string().min(1),
  passwordHash: z.string().min(1),
  emailVerified: z.string().min(1),
});

export const zAppUserData = zMapDbToAppData(zUserDto).extend({
  emailVerified: z.nativeEnum(EmailVerificationState),
});

export const zDbUserData = zMapAppToDbData(zUserDto);
