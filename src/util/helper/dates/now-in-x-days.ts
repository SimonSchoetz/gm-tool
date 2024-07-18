import { DateTime } from 'luxon';

export const nowInXDays = (days: number): Date => {
  const now = DateTime.now();
  const futureDate = now.plus({ days });
  const roundedFutureDate = futureDate.set({ millisecond: 0 });
  return roundedFutureDate.toJSDate();
};
