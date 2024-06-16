import { z } from 'zod';

const envSchema = z.object({
  AWS_DYNAMODB_ACCESS_KEY: z.string().min(1),
  AWS_DYNAMODB_SECRET_KEY: z.string().min(1),
  AWS_DYNAMODB_REGION: z.string().min(1),
  JWT_AUTH_SECRET: z.string().min(1),
});

export const parsedEnv = envSchema.parse(process.env);
