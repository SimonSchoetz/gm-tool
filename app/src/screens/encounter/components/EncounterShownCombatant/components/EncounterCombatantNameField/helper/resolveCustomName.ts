export const resolveCustomName = (
  typed: string,
  automaticName: string,
): string | null => {
  const trimmed = typed.trim();
  return trimmed === '' || trimmed === automaticName ? null : trimmed;
};
