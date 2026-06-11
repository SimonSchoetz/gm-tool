import { RefObject } from 'react';
import { Beam, Grid } from '../types';
import { getCumulativeLengths } from './getCumulativeLengths';
import { extractColorTriplet } from './extractColorTriplet';
import { generateZigzagPath } from './generateZigzagPath';
import { getColor } from './getColor';
import { getPositionOnPath } from './getPositionOnPath';

export const updateBeams = (
  beamsRef: RefObject<Beam[]>,
  gridRef: RefObject<Grid>,
) => {
  const now = Date.now();

  beamsRef.current.forEach((beam) => {
    if (now > beam.nextSpawnTime && !beam.active) {
      beam.path = generateZigzagPath(gridRef);
      beam.cumulativeLengths = getCumulativeLengths(beam.path);
      beam.pathLength = beam.cumulativeLengths.at(-1) ?? 0;
      beam.colorTriplet = extractColorTriplet(beam.color);
      beam.progress = 0;
      beam.active = true;
      beam.color = getColor('--color-primary');
      beam.particles = [];
    }

    if (beam.active && beam.path.length > 0) {
      const currentPosition = getPositionOnPath(
        beam.path,
        beam.cumulativeLengths,
        beam.progress,
      );

      if (currentPosition) {
        beam.particles.push({
          x: currentPosition.x,
          y: currentPosition.y,
          age: 0,
          maxAge: beam.speed * 5,
          progress: beam.progress,
        });
      }

      beam.progress += beam.speed;

      if (beam.progress >= beam.pathLength) {
        beam.active = false;
        beam.nextSpawnTime = now + Math.random() * 10000 + 5000;
      }
    }

    for (let i = beam.particles.length - 1; i >= 0; i--) {
      beam.particles[i].age++;
      if (beam.particles[i].age >= beam.particles[i].maxAge) {
        beam.particles.splice(i, 1);
      }
    }
  });
};
