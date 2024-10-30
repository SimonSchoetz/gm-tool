'use client';

import { useEffect, useState } from 'react';
import { BackdropGrid } from './components';
import dynamic from 'next/dynamic';

const BackdropBeam = dynamic(() => import('./components/BackdropBeam'), {
  ssr: false,
});

const Backdrop = () => {
  const [idList, setIdList] = useState<string[]>([]);
  const [fadeIn, setFadeIn] = useState<boolean>(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity .1s ease-in-out',
      }}
      className='overflow-hidden fixed -z-10'
    >
      <BackdropGrid setIdList={setIdList} />
      {Array.from({ length: 3 }).map((_, index) => (
        <BackdropBeam idList={idList} key={index} />
      ))}
    </div>
  );
};

export default Backdrop;
