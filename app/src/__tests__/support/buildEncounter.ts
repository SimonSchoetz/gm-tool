import type { Encounter } from '@db/encounter';

export const buildEncounter = (
  overrides: Partial<Encounter> = {},
): Encounter => ({
  id: 'encounter-1',
  adventure_id: 'adventure-1',
  name: null,
  description: null,
  pinned_order: null,
  hide_defeated: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
  ...overrides,
});
