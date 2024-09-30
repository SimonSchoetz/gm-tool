import { DateTime } from 'luxon';

export const nowInXDays = (days: number): Date => {
  const now = DateTime.utc();
  const futureDate = now.plus({ days });
  const roundedFutureDate = futureDate.set({ millisecond: 0 });
  return roundedFutureDate.toJSDate();
};
