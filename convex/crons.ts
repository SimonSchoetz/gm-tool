import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

export const crons = cronJobs();

crons.daily(
  'cleanupSessions',
  { hourUTC: 0, minuteUTC: 0 },
  internal.cron_jobs.sessions.cleanupSessions
);

export default crons;
