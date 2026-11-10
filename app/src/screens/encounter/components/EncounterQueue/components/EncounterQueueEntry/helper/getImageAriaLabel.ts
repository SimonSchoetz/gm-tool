import type { describeQueueEntryImage } from './describeQueueEntryImage';

export const getImageAriaLabel = (
  imageLook: ReturnType<typeof describeQueueEntryImage>,
): string | null => (imageLook === 'grey' ? 'Greyed-out image' : null);
