import { z } from 'zod';

const envValidator = z.object({
  HOST: z.string().optional(),
  AUTH_TOKEN_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CONVEX_DEPLOYMENT: z.string().optional(),
  NEXT_PUBLIC_CONVEX_URL: z.string().optional(),
  SESSION_SIGNATURE_SECRET: z.string().optional(),
});

//eslint-disable-next-line no-process-env
export const parsedEnv = envValidator.parse(process.env);

//eslint-disable-next-line no-process-env
export const currentEnv = process.env.NODE_ENV;
