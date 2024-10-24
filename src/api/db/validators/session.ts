import { z } from 'zod';
import { zMapAppToDbData, zMapDbToAppData } from './util';

export const zSessionDto = z.object({
  refreshToken: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.string().min(1), // ISO string,
});

export const zAppSessionDto = zMapDbToAppData(zSessionDto);

export const zDbSessionDto = zMapAppToDbData(zSessionDto);

export const zCreateSessionDto = zSessionDto;
