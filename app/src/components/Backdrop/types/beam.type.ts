import { Particle } from './particle.type';

export type Beam = {
  path: { x: number; y: number }[];
  particles: Particle[];
  color: string;
  nextSpawnTime: number;
  progress: number;
  pathLength: number;
  speed: number;
  active: boolean;
};
