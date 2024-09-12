'use client';
import { ConditionWrapper } from '@/components/wrapper';
import { useEffect, useState } from 'react';

type CountdownProps = {
  length: number;
  interval: number; // ms
  resolve: () => unknown;
};

const Countdown: React.FC<Readonly<CountdownProps>> = ({
  length,
  interval,
  resolve,
}) => {
  const [countdown, setCountdown] = useState(length);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          clearInterval(countdownInterval);
          resolve();
          return 0;
        }
      });
    }, interval);

    return () => clearInterval(countdownInterval);
  }, [interval, resolve]);

  return (
    <ConditionWrapper condition={countdown > 0}>
      <p
        className='text-center text-6xl countdown-animation'
        aria-live='assertive'
        key={countdown}
      >
        {countdown}
      </p>
    </ConditionWrapper>
  );
};

export default Countdown;
