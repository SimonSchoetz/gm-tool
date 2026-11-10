export const getActiveIndex = <T extends string>(
  options: [{ value: T }, { value: T }],
  value: T,
): number => (options[0].value === value ? 0 : 1);
