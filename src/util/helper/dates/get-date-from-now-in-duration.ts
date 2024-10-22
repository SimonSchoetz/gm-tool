import { DateTime, DurationLikeObject } from 'luxon';

export const getDateFromNowInDuration = (
  duration: DurationLikeObject
): Date => {
  const now = DateTime.utc();
  const futureDate = now.plus(duration);
  const roundedFutureDate = futureDate.set({ millisecond: 0 });
  return roundedFutureDate.toJSDate();
};
