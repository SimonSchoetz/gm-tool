import { BellRingIcon } from 'lucide-react';
import { ImagePlaceholderFrame } from '@/components/ImagePlaceholderFrame/ImagePlaceholderFrame';
import { QUEUE_ENTRY_IMAGE_SIZE } from '../../EncounterQueueEntry.constants';

export const EncounterQueueEventTile = () => (
  <ImagePlaceholderFrame
    dimensions={{
      width: QUEUE_ENTRY_IMAGE_SIZE,
      height: QUEUE_ENTRY_IMAGE_SIZE,
    }}
    aria-label='Event icon'
  >
    <BellRingIcon size={QUEUE_ENTRY_IMAGE_SIZE / 2} />
  </ImagePlaceholderFrame>
);
