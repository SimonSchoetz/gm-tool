import { describeQueueEntryHp } from '../../../../../helper/describeQueueEntryHp';
import { describeQueueEntryImage } from './describeQueueEntryImage';

type QueueEntryLookInput =
  | ({ kind: 'combatant'; defeated: boolean } & Parameters<
      typeof describeQueueEntryHp
    >[0])
  | { kind: 'event' };

// An event has no defeated flag and no HP, so `describeQueueEntryImage` would return plain for it too.
export const describeQueueEntryLook = (
  entry: QueueEntryLookInput,
): {
  hp: ReturnType<typeof describeQueueEntryHp>;
  imageLook: ReturnType<typeof describeQueueEntryImage>;
} => {
  if (entry.kind === 'event') return { hp: null, imageLook: 'plain' };
  const hp = describeQueueEntryHp(entry);
  return { hp, imageLook: describeQueueEntryImage(hp, entry.defeated) };
};
