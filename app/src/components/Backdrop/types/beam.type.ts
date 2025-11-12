import { Particle } from './particle.type';

export type Beam = {
  path: { x: number; y: number }[];
  currentIndex: number;
  particles: Particle[];
  color: string;
  nextSpawnTime: number;
  progress: number; // 0 to 1, tracks position along path
  speed: number; // pixels per frame
  active: boolean;
};
