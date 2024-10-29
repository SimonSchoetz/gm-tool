import { z } from 'zod';
import { zMapAppToDbData, zMapDbToAppData } from './util';

export const zSessionDto = z.object({
  sessionToken: z.string().min(1),
  userId: z.string().min(1),
});

export const zAppSessionData = zMapDbToAppData(zSessionDto);

export const zDbSessionData = zMapAppToDbData(zSessionDto);

export const zCreateSessionDto = zSessionDto;
