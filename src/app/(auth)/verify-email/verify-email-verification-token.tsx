'use client';

import { verifyEmail } from '@/actions/auth';
import { ConditionWrapper } from '@/components/wrapper';
import { Route } from '@/enums';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import RequestNewVerificationEmailForm from './request-new-verification-email-form';
import { Countdown } from '@/components/animations';

type VerifyEmailVerificationTokenProps = {
  token: string;
};
const VerifyEmailVerificationToken: React.FC<
  VerifyEmailVerificationTokenProps
> = ({ token }) => {
  const [error, setError] = useState<string>();
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      const emailVerified = token && (await verifyEmail(token));
      if (emailVerified && !emailVerified?.success) {
        setError(emailVerified.message);
      }
    };
    if (token) {
      verify();
    }
  }, [token]);

  return (
    <>
      <ConditionWrapper condition={!!error?.includes('expired')}>
        <p className='text-center my-5'>
          Well damn, the token is already expired. You can get a new one by
          entering your email below.
        </p>
      </ConditionWrapper>

      <ConditionWrapper condition={!!error?.includes('unknown')}>
        <p className='text-center my-5'>
          Something went wrong. If this continues to happen, please contact our
          support.
          {error}
        </p>
      </ConditionWrapper>

      <ConditionWrapper condition={!!error}>
        <RequestNewVerificationEmailForm />
      </ConditionWrapper>

      <ConditionWrapper condition={!error}>
        <p className='text-center my-5'>
          Success! You will be redirected to login in
        </p>
        <Countdown
          length={5}
          interval={1000}
          resolve={() => router.push(Route.LOGIN)}
        />
      </ConditionWrapper>
    </>
  );
};

export default VerifyEmailVerificationToken;
