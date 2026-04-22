import { RefObject } from 'react';
import { Beam, Grid } from '../types';
import { rgbToRgba } from './rgbToRgba';
import { generateZigzagPath } from './generateZigzagPath';
import { getColor } from './getColor';
import { getPathLength } from './getPathLength';
import { getPositionOnPath } from './getPositionOnPath';

export const createBeams = (
  beamsRef: RefObject<Beam[]>,
  ctx: CanvasRenderingContext2D,
  gridRef: RefObject<Grid>,
) => {
  drawBeams(beamsRef, ctx);
  updateBeams(beamsRef, gridRef);
};

const drawBeams = (
  beamsRef: RefObject<Beam[]>,
  ctx: CanvasRenderingContext2D,
) => {
  beamsRef.current.forEach((beam) => {
    if (beam.particles.length === 0) return;

    ctx.shadowBlur = 0;
    ctx.shadowColor = beam.color;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'bevel';

    for (let i = beam.particles.length - 1; i >= 0; i--) {
      const particle = beam.particles[i];
      const opacity = Math.max(0, 1 - particle.age / particle.maxAge);
      const width = 0.5;

      ctx.strokeStyle = rgbToRgba(beam.color, opacity);
      ctx.lineWidth = width;

      if (i > 0) {
        const prevParticle = beam.particles[i - 1];
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(prevParticle.x, prevParticle.y);
        ctx.stroke();
      }

      if (i === beam.particles.length - 1) {
        ctx.fillStyle = beam.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, width * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
};

const updateBeams = (beamsRef: RefObject<Beam[]>, gridRef: RefObject<Grid>) => {
  const now = Date.now();

  beamsRef.current.forEach((beam) => {
    if (now > beam.nextSpawnTime && !beam.active) {
      beam.path = generateZigzagPath(gridRef);
      beam.progress = 0;
      beam.active = true;
      beam.color = getColor('--color-primary');
      beam.particles = [];
      beam.pathLength = getPathLength(beam.path);
    }

    if (beam.active && beam.path.length > 0) {
      const currentPosition = getPositionOnPath(beam.path, beam.progress);

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
