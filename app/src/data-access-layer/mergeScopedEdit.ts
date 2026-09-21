import { mergeUpdate } from './mergeUpdate';

export const mergeScopedEdit = <Edit extends { data: object }>(
  pending: Edit,
  patch: Edit,
): Edit => ({ ...patch, data: mergeUpdate(pending.data, patch.data) });
