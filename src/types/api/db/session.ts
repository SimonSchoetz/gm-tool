import {
  zAppSessionDto,
  zCreateSessionDto,
  zDbSessionDto,
  zSessionDto,
} from '@/api/db/validators';
import { z } from 'zod';

export type SessionDto = z.infer<typeof zSessionDto>;

export type AppSessionDto = z.infer<typeof zAppSessionDto>;

export type DbSessionDto = z.infer<typeof zDbSessionDto>;

export type CreateSessionDto = z.infer<typeof zCreateSessionDto>;
