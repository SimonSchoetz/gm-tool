'use client';

import { DetailedHTMLProps, HTMLAttributes, useEffect, useState } from 'react';

type LightSourceProps = {
  intensity: 'bright' | 'dim';
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const LightSource = ({ intensity, ...props }: Readonly<LightSourceProps>) => {
  const [fadeIn, setFadeIn] = useState<boolean>(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);
  const intensityClass =
    intensity === 'bright' ? 'light-source' : 'light-source-dim';

  return (
    <div
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity .3s ease-in',
      }}
      className={`${intensityClass} ${props.className} absolute top-0 left-0 w-full h-full -z-[9]`}
    ></div>
  );
};

export default LightSource;
