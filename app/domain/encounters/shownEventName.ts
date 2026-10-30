import { normalizeQueueItemName } from './queueItemName';

export const UNNAMED_EVENT_LABEL = 'Untitled Event';

export const shownEventName = (name: string | null): string =>
  normalizeQueueItemName(name) ?? UNNAMED_EVENT_LABEL;
