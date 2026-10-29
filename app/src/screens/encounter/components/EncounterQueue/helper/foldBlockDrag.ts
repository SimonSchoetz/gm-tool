export const foldBlockDrag = <T extends { folded: boolean }>(
  blockDrag: T | null,
): T | null =>
  blockDrag === null ? blockDrag : { ...blockDrag, folded: true };
