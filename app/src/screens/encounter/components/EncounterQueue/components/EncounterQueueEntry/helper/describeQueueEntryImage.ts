import type { describeQueueEntryHp } from '../../../../../helper/describeQueueEntryHp';

export const describeQueueEntryImage = (
  hp: ReturnType<typeof describeQueueEntryHp>,
  defeated: boolean,
): 'grey' | 'tint' | 'plain' => {
  if (defeated || hp?.state === 'down') return 'grey';
  return hp?.state === 'hurt' ? 'tint' : 'plain';
};
