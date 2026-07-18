export { getChangesSince } from './get-changes-since';
export { getMaxSeq } from './get-max-seq';
export { getRowById } from './get-row-by-id';
export {
  getPeerWatermark,
  setPeerWatermark,
  removePeerState,
} from './peer-state';
export { applyUpsert } from './apply-upsert';
export { applyDelete } from './apply-delete';
export { SYNCED_TABLES, SYNCED_TABLE_NAMES } from './registry';
export type { SyncChangeRecord } from './schema';
