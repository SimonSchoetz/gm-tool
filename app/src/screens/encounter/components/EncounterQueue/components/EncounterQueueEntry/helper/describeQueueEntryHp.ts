export const describeQueueEntryHp = (hp: {
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
}): {
  text: string;
  state: 'ok' | 'hurt' | 'down';
  lostShare: number;
} | null => {
  const { maxHp, currentHp, tempHp } = hp;
  if (maxHp === null || currentHp === null) return null;

  const text = `${currentHp} / ${maxHp}${tempHp > 0 ? ` +${tempHp}` : ''}`;
  if (currentHp <= 0 || maxHp <= 0)
    return { text, state: 'down', lostShare: 1 };
  if (currentHp >= maxHp) return { text, state: 'ok', lostShare: 0 };
  return { text, state: 'hurt', lostShare: (maxHp - currentHp) / maxHp };
};
