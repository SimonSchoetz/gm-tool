const computeTempShare = (tempHp: number, maxHp: number): number => {
  if (tempHp <= 0) return 0;
  // A max HP of 0 or below is clamped to 0: the division then gives Infinity, which the cap turns into a full share.
  return Math.min(1, tempHp / Math.max(maxHp, 0));
};

export const describeQueueEntryHp = (hp: {
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
}): {
  text: string;
  state: 'ok' | 'hurt' | 'down';
  lostShare: number;
  tempHp: number;
  tempShare: number;
} | null => {
  const { maxHp, currentHp, tempHp } = hp;
  if (maxHp === null || currentHp === null) return null;

  const shared = {
    text: `${currentHp}/${maxHp}`,
    tempHp,
    tempShare: computeTempShare(tempHp, maxHp),
  };
  if (currentHp <= 0 || maxHp <= 0)
    return { ...shared, state: 'down', lostShare: 1 };
  if (currentHp >= maxHp) return { ...shared, state: 'ok', lostShare: 0 };
  return { ...shared, state: 'hurt', lostShare: (maxHp - currentHp) / maxHp };
};
