import { z } from 'zod';

const envValidator = z.object({
  HOST: z.string().min(1),
  AWS_DYNAMODB_ACCESS_KEY: z.string().min(1), //todo: remove aws keys
  AWS_DYNAMODB_SECRET_KEY: z.string().min(1),
  AWS_DYNAMODB_REGION: z.string().min(1),
  TOKEN_AUTH_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CONVEX_DEPLOYMENT: z.string().min(1),
  NEXT_PUBLIC_CONVEX_URL: z.string().min(1),
});

//eslint-disable-next-line no-process-env
export const parsedEnv = envValidator.parse(process.env);
