import type { CSSProperties } from 'react';
import type { describeQueueEntryHp } from '../../../../../helper/describeQueueEntryHp';

export const buildHpLostStyle = (
  hp: ReturnType<typeof describeQueueEntryHp>,
): CSSProperties =>
  hp
    ? ({ '--rt-encounter-queue-entry-hp-lost': hp.lostShare } as CSSProperties)
    : {};
