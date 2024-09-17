import { parsedEnv } from '@/util/helper';
import { ConvexHttpClient } from 'convex/browser';

export const convexDb = new ConvexHttpClient(parsedEnv.NEXT_PUBLIC_CONVEX_URL);
