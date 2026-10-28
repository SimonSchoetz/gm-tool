import { arrayMove } from '@dnd-kit/sortable';

export const reorderIds = (
  ids: string[],
  activeId: string,
  overId: string,
): string[] => arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId));
