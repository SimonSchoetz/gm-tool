export const formatSavedHpText = (savedHp: number | null): string =>
  savedHp === null ? '' : String(savedHp);
