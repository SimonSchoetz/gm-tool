import { headers } from 'next/headers';

export const createFingerprint = (): string => {
  const headersList = headers();

  const userAgent = headersList.get('user-agent') ?? 'unknown user agent';

  const forwardedFor = headersList.get('x-forwarded-for');
  const ip = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : headersList.get('x-real-ip') || 'unknown ip';

  return `${userAgent} | ${ip}`;
};
