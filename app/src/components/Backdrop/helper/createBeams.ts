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
  gridRef: RefObject<Grid>
) => {
  drawBeams(beamsRef, ctx);
  updateBeams(beamsRef, gridRef);
};

const drawBeams = (
  beamsRef: RefObject<Beam[]>,
  ctx: CanvasRenderingContext2D
) => {
  beamsRef.current.forEach((beam) => {
    if (beam.particles.length === 0) return;

    // Draw line segments connecting particles for smooth trail
    ctx.shadowBlur = 0;
    ctx.shadowColor = beam.color;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'bevel';

    // Draw from oldest to newest for proper layering
    for (let i = beam.particles.length - 1; i >= 0; i--) {
      const particle = beam.particles[i];
      const opacity = Math.max(0, 1 - particle.age / particle.maxAge);
      const width = 1;

      ctx.strokeStyle = rgbToRgba(beam.color, opacity);
      ctx.lineWidth = width;

      if (i > 0) {
        const prevParticle = beam.particles[i - 1];
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(prevParticle.x, prevParticle.y);
        ctx.stroke();
      }

      //Draw a bright dot at the head
      if (i === beam.particles.length - 1) {
        ctx.fillStyle = beam.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, width * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // Reset shadow and line properties
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
};

const updateBeams = (beamsRef: RefObject<Beam[]>, gridRef: RefObject<Grid>) => {
  const now = Date.now();

  beamsRef.current.forEach((beam) => {
    // Start new beam if it's time
    if (now > beam.nextSpawnTime && !beam.active) {
      beam.path = generateZigzagPath(gridRef);
      beam.progress = 0;
      beam.active = true;
      beam.color = getColor('--color-primary');
      beam.particles = [];
    }

    // Update active beam
    if (beam.active && beam.path.length > 0) {
      const pathLength = getPathLength(beam.path);
      const currentPosition = getPositionOnPath(beam.path, beam.progress);

      if (currentPosition) {
        // Spawn new particle at current position
        beam.particles.push({
          x: currentPosition.x,
          y: currentPosition.y,
          age: 0,
          maxAge: beam.speed * 5,
        });
      }

      beam.progress += beam.speed;

      // Check if beam completed
      if (beam.progress >= pathLength) {
        beam.active = false;
        beam.nextSpawnTime = now + Math.random() * 10000 + 5000;
      }
    }

    // Update and remove old particles
    beam.particles = beam.particles
      .map((particle) => ({
        ...particle,
        age: particle.age + 1,
      }))
      .filter((particle) => particle.age < particle.maxAge);
  });
};
