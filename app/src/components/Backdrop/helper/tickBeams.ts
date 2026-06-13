import { Application, Color, Graphics, RenderTexture } from 'pixi.js';
import { getPositionOnPath } from './getPositionOnPath';
import type { Beam } from '../types';

type TickBeamsArgs = {
  beams: Beam[];
  beamRenderTexture: RenderTexture;
  primaryColor: string;
  app: Application;
  headGraphics: Graphics;
  fadeGraphics: Graphics;
  deltaMS: number;
  beamTailAlpha: number;
  onIdle: () => void;
};

export const tickBeams = ({
  beams,
  beamRenderTexture,
  primaryColor,
  app,
  headGraphics,
  fadeGraphics,
  deltaMS,
  beamTailAlpha,
  onIdle,
}: TickBeamsArgs): void => {
  const brt = beamRenderTexture;

  fadeGraphics
    .clear()
    .rect(0, 0, window.innerWidth, window.innerHeight)
    .fill({ color: 'black', alpha: beamTailAlpha });
  app.renderer.render({ container: fadeGraphics, target: brt, clear: false });

  headGraphics.clear();
  let anyActive = false;

  for (const beam of beams) {
    if (beam.spawnDelay > 0) {
      anyActive = true;
      beam.spawnDelay -= deltaMS;
      if (beam.spawnDelay <= 0) {
        beam.spawnDelay = 0;
        beam.active = true;
      }
    }
    if (!beam.active) continue;
    anyActive = true;

    const totalLength = beam.cumulativeLengths.at(-1) ?? 0;
    const prevDistance = beam.headDistance;
    beam.headDistance += beam.speed * deltaMS;

    if (beam.headDistance >= totalLength) {
      beam.active = false;
      continue;
    }

    const pos = getPositionOnPath(
      beam.path,
      beam.cumulativeLengths,
      beam.headDistance,
    );
    const prevPos = getPositionOnPath(
      beam.path,
      beam.cumulativeLengths,
      Math.max(0, prevDistance),
    );

    if (pos && prevPos) {
      headGraphics.moveTo(prevPos.x, prevPos.y);
      for (let k = 1; k < beam.path.length; k++) {
        const cornerDist = beam.cumulativeLengths[k];
        if (cornerDist > prevDistance && cornerDist < beam.headDistance) {
          headGraphics.lineTo(beam.path[k].x, beam.path[k].y);
        }
      }
      headGraphics
        .lineTo(pos.x, pos.y)
        .stroke({ width: 1, color: new Color(primaryColor), alpha: 1 });
    }
  }

  app.renderer.render({ container: headGraphics, target: brt, clear: false });

  if (!anyActive) {
    onIdle();
  }
};
