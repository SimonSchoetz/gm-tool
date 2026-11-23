import { BellRingIcon } from 'lucide-react';
import { ImagePlaceholderFrame } from '@/components/ImagePlaceholderFrame/ImagePlaceholderFrame';
import { QUEUE_ENTRY_IMAGE_SIZE } from '../../EncounterQueueEntry.constants';
// After the ImagePlaceholderFrame import: .encounter-queue-event-tile and .glass-panel set border-radius at equal specificity, and the later stylesheet wins.
import './EncounterQueueEventTile.css';

const EVENT_TILE_DIMENSIONS = {
  width: QUEUE_ENTRY_IMAGE_SIZE,
  height: QUEUE_ENTRY_IMAGE_SIZE,
};

export const EncounterQueueEventTile = () => {
  return (
    <ImagePlaceholderFrame
      className='encounter-queue-event-tile'
      dimensions={EVENT_TILE_DIMENSIONS}
      aria-label='Event icon'
    >
      <BellRingIcon size={QUEUE_ENTRY_IMAGE_SIZE / 2} />
    </ImagePlaceholderFrame>
  );
};
