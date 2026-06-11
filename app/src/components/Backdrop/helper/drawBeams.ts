import { RefObject } from 'react';
import { Beam } from '../types';

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
        const waypoints: { x: number; y: number }[] = [
          { x: olderParticle.x, y: olderParticle.y },
        ];
        for (let j = 1; j < beam.cumulativeLengths.length - 1; j++) {
          if (
            beam.cumulativeLengths[j] > olderParticle.progress &&
            beam.cumulativeLengths[j] < particle.progress
          ) {
            waypoints.push(beam.path[j]);
          }
          if (beam.cumulativeLengths[j] >= particle.progress) break;
        }
        waypoints.push({ x: particle.x, y: particle.y });
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
