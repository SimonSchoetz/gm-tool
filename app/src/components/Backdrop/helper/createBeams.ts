import { RefObject } from 'react';
import { Beam, Grid } from '../types';
import { getCumulativeLengths } from './getCumulativeLengths';
import { extractColorTriplet } from './extractColorTriplet';
import { generateZigzagPath } from './generateZigzagPath';
import { getColor } from './getColor';
import { getPositionOnPath } from './getPositionOnPath';
import { getWaypointsBetween } from './getWaypointsBetween';

export const createBeams = (
  beamsRef: RefObject<Beam[]>,
  ctx: CanvasRenderingContext2D,
  gridRef: RefObject<Grid>,
) => {
  drawBeams(beamsRef, ctx);
  updateBeams(beamsRef, gridRef);
};

export const drawBeams = (
  beamsRef: RefObject<Beam[]>,
  ctx: CanvasRenderingContext2D,
) => {
  beamsRef.current.forEach((beam) => {
    if (beam.particles.length === 0) return;

    ctx.lineCap = 'butt';
    ctx.lineJoin = 'bevel';

    for (let i = beam.particles.length - 1; i >= 0; i--) {
      const particle = beam.particles[i];
      const opacity = Math.max(0, 1 - particle.age / particle.maxAge);
      const width = 0.5;

      const strokeColor =
        beam.colorTriplet !== null
          ? `rgb(${beam.colorTriplet}, ${opacity})`
          : beam.color;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;

      if (i > 0) {
        const olderParticle = beam.particles[i - 1];
        const waypoints = getWaypointsBetween(
          beam.path,
          beam.cumulativeLengths,
          olderParticle.progress,
          particle.progress,
        );
        if (waypoints.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(waypoints[0].x, waypoints[0].y);
          for (let w = 1; w < waypoints.length; w++) {
            ctx.lineTo(waypoints[w].x, waypoints[w].y);
          }
          ctx.stroke();
        }
      }

      if (i === beam.particles.length - 1) {
        ctx.fillStyle = beam.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, width * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  ctx.lineWidth = 1;
};

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
