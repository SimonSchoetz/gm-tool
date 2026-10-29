export const getActionAvailability = ({
  amount,
  hasHp,
  defeated,
  isRecording,
}: {
  amount: number | null;
  hasHp: boolean;
  defeated: boolean;
  isRecording: boolean;
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
    damage: !isRecording && hasAmount && hasHp,
    heal: !isRecording && hasAmount && hasHp,
    setTempHp: !isRecording && hasAmount,
    setMaxHp: !isRecording && hasAmount,
    markDefeated: !isRecording && !defeated,
    unmarkDefeated: !isRecording && defeated,
    remove: !isRecording,
  };
};
