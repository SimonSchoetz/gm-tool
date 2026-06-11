import { Beam, Bounds } from '../types';
import { getWaypointsBetween } from './getWaypointsBetween';

export const getBeamBounds = (beam: Beam, padding: number): Bounds | null => {
  if (beam.particles.length === 0) return null;

  const fromProgress = beam.particles[0].progress;
  const toProgress = beam.particles[beam.particles.length - 1].progress;

  const waypoints = getWaypointsBetween(
    beam.path,
    beam.cumulativeLengths,
    fromProgress,
    toProgress,
  );

  if (waypoints.length === 0) return null;

  let minX = waypoints[0].x;
  let maxX = waypoints[0].x;
  let minY = waypoints[0].y;
  let maxY = waypoints[0].y;

  for (let i = 1; i < waypoints.length; i++) {
    if (waypoints[i].x < minX) minX = waypoints[i].x;
    if (waypoints[i].x > maxX) maxX = waypoints[i].x;
    if (waypoints[i].y < minY) minY = waypoints[i].y;
    if (waypoints[i].y > maxY) maxY = waypoints[i].y;
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
};
