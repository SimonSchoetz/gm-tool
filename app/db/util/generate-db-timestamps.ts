export const generateDbTimestamps = (): {
  created_at: string;
  updated_at: string;
  now: string;
} => {
  const now = new Date().toISOString();
  return { created_at: now, updated_at: now, now };
};
