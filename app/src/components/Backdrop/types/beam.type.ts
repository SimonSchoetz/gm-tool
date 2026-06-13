export type Beam = {
  path: { x: number; y: number }[];
  cumulativeLengths: number[];
  headDistance: number;
  speed: number;
  active: boolean;
  spawnDelay: number;
};
