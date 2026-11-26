import { QUEUE_ENTRY_IMAGE_SIZE } from '../../../EncounterQueueEntry.constants';
import { QUEUE_ENTRY_IMAGE_RADIUS } from '../EncounterQueueEntryTempFrame.constants';

export const buildTempFramePaths = (
  inset: number,
): { left: string; right: string } => {
  const size = QUEUE_ENTRY_IMAGE_SIZE;
  const radius = QUEUE_ENTRY_IMAGE_RADIUS;
  const centre = size / 2;
  const arcRadius = radius - inset;

  // Both halves are one shape mirrored: they differ in the x of the side they climb, the x where the corners meet the flat edges, and the arcs' sweep direction.
  const buildHalf = (sideX: number, cornerX: number, sweep: 0 | 1) => {
    const arcTo = (x: number, y: number) =>
      `A ${arcRadius} ${arcRadius} 0 0 ${sweep} ${x} ${y}`;

    return [
      `M ${centre} ${size - inset}`,
      `L ${cornerX} ${size - inset}`,
      arcTo(sideX, size - radius),
      `L ${sideX} ${radius}`,
      arcTo(cornerX, inset),
      `L ${centre} ${inset}`,
    ].join(' ');
  };

  return {
    left: buildHalf(inset, radius, 1),
    right: buildHalf(size - inset, size - radius, 0),
  };
};
