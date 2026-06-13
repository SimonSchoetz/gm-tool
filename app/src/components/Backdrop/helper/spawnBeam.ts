import { RefObject } from 'react';
import { getCumulativeLengths } from './getCumulativeLengths';
import { generateZigzagPath } from './generateZigzagPath';
import type { Beam } from '../types';
import type { Grid } from '../types';

const BEAM_SPEED = 0.4;

export const spawnBeam = (
  beam: Beam,
  gridRef: RefObject<Grid>,
  delay = 0,
): void => {
  beam.path = generateZigzagPath(gridRef);
  beam.cumulativeLengths = getCumulativeLengths(beam.path);
  beam.headDistance = 0;
  beam.speed = BEAM_SPEED * (0.5 + Math.random() * 0.6);
  beam.spawnDelay = delay;
  beam.active = delay === 0;
};
