'use client';

import { useEffect } from 'react';

const Backdrop = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const gridElement = document.querySelector(
        '.blueprint-grid-primary'
      ) as HTMLElement;

      if (gridElement) {
        gridElement.style.backgroundPosition = `${-(scrollX / 3)}px ${-(
          scrollY / 3
        )}px`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return <></>;
};

export default Backdrop;
