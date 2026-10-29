export const getActionAvailability = ({
  amount,
  hasHp,
  defeated,
  isWriting,
}: {
  amount: number | null;
  hasHp: boolean;
  defeated: boolean;
  isWriting: boolean;
}): {
  damage: boolean;
  heal: boolean;
  setTempHp: boolean;
  setMaxHp: boolean;
  markDefeated: boolean;
  unmarkDefeated: boolean;
  remove: boolean;
} => {
  const hasAmount = amount !== null;
  return {
    damage: !isWriting && hasAmount && hasHp,
    heal: !isWriting && hasAmount && hasHp,
    setTempHp: !isWriting && hasAmount,
    setMaxHp: !isWriting && hasAmount,
    markDefeated: !isWriting && !defeated,
    unmarkDefeated: !isWriting && defeated,
    remove: !isWriting,
  };
};
