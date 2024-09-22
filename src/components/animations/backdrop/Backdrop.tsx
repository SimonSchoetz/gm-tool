'use client';

import { useEffect, useState } from 'react';
import { BackdropBeam, BackdropGrid } from './components';

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
      <BackdropBeam idList={idList} />
      <BackdropBeam idList={idList} />
      <BackdropBeam idList={idList} />
      <BackdropBeam idList={idList} />
      <BackdropBeam idList={idList} />
    </div>
  );
};

export default Backdrop;
