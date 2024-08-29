'use client';

import { useState } from 'react';
import { BackdropBeam, BackdropGrid } from './components';

const Backdrop = () => {
  const [idList, setIdList] = useState<string[]>([]);

  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      className='overflow-hidden absolute -z-10'
    >
      <BackdropGrid setIdList={setIdList} />
      <BackdropBeam idList={idList} />
    </div>
  );
};

export default Backdrop;
