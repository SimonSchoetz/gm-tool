import {
  zAppSessionData,
  zCreateSessionDto,
  zDbSessionData,
  zSessionDto,
} from '@/api/db/validators';
import { z } from 'zod';
import { AppData, DbData } from './generics';

export type SessionDto = z.infer<typeof zSessionDto>;

export type AppSessionData = AppData<z.infer<typeof zAppSessionData>>;

export type DbSessionData = DbData<z.infer<typeof zDbSessionData>>;

export type CreateSessionDto = z.infer<typeof zCreateSessionDto>;
