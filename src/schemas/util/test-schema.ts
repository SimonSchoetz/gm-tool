import { z } from 'zod';

export const TestSchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
});
