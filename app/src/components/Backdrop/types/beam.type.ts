import { Particle } from './particle.type';
import { Bounds } from './bounds.type';

export type Beam = {
  path: { x: number; y: number }[];
  particles: Particle[];
  color: string;
  nextSpawnTime: number;
  progress: number;
  pathLength: number;
  speed: number;
  active: boolean;
  cumulativeLengths: number[];
  colorTriplet: string | null;
  lastDrawnBounds: Bounds | null;
};
