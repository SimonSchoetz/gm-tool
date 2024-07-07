import { UserSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';

export type User = z.infer<typeof UserSchema>;
