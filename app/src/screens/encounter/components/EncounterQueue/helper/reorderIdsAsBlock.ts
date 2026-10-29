import { reorderIds } from '@/util/reorderIds';

export const reorderIdsAsBlock = (
  ids: string[],
  blockIds: string[],
  activeId: string,
  overId: string,
): string[] => {
  const withoutOthers = ids.filter(
    (id) => id === activeId || !blockIds.includes(id),
  );
  const block = ids.filter((id) => blockIds.includes(id));

  return reorderIds(withoutOthers, activeId, overId).flatMap((id) =>
    id === activeId ? block : [id],
  );
};
