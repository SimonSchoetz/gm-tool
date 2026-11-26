import { QUEUE_ENTRY_IMAGE_SIZE } from '../../../EncounterQueueEntry.constants';
import { TEMP_FRAME_EDGE_WIDTH } from '../EncounterQueueEntryTempFrame.constants';

// The share of the image's height, measured from the bottom, up to which the frame shows. Below a full share it never drops under the band holding the bottom edge, nor rises into the band holding the top edge.
export const computeTempFrameReach = (share: number): number => {
  if (share >= 1) return 1;

  const edgeBand = TEMP_FRAME_EDGE_WIDTH / QUEUE_ENTRY_IMAGE_SIZE;
  return Math.min(Math.max(share, edgeBand), 1 - edgeBand);
};
