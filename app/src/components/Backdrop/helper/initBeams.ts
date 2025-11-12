import { RefObject } from 'react';
import { Beam } from '../types';
import { getColor } from './getColor';

export const initBeams = (
  beamsRef: RefObject<Beam[]>,
  numBeams: number,
  beamSpeed: number
) => {
  for (let i = 0; i < numBeams; i++) {
    beamsRef.current.push({
      path: [],
      currentIndex: 0,
      particles: [],
      color: getColor('--color-primary'),
      nextSpawnTime: Date.now() + Math.random() * 10000 + i * 2000,
      progress: 0,
      speed: beamSpeed + i * 0.5,
      active: false,
    });
  }
};
