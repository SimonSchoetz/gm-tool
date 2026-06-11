import { RefObject } from 'react';
import { Beam } from '../types';
import { getColor } from './getColor';
import { getCumulativeLengths } from './getCumulativeLengths';
import { extractColorTriplet } from './extractColorTriplet';

export const initBeams = (
  beamsRef: RefObject<Beam[]>,
  numBeams: number,
  beamSpeed: number,
) => {
  for (let i = 0; i < numBeams; i++) {
    const color = getColor('--color-primary');
    beamsRef.current.push({
      path: [],
      particles: [],
      color,
      nextSpawnTime: Date.now() + Math.random() * 10000 + i * 2000,
      progress: 0,
      pathLength: 0,
      speed: beamSpeed + i,
      active: false,
      cumulativeLengths: getCumulativeLengths([]),
      colorTriplet: extractColorTriplet(color),
      lastDrawnBounds: null,
    });
  }
};
