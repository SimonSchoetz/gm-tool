'use client';

import { DivProps } from '@/types/app';
import { useEffect } from 'react';

type LightSourceProps = {
  intensity: 'bright' | 'dim';
} & DivProps;

const LightSource = ({
  intensity,
  className = '',
  ...props
}: Readonly<LightSourceProps>) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--light-state', 'running');
  }, []);

  const intensityClass =
    intensity === 'bright' ? 'light-source' : 'light-source-dim';
  const localClassNames =
    'light-on-animation fixed top-0 left-0 w-full h-full -z-[9]';

  return (
    <div
      {...props}
      className={`${intensityClass} ${localClassNames} ${className}`}
    ></div>
  );
};

export default LightSource;
