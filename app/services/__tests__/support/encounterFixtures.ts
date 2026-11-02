import type { Encounter } from '@db/encounter';

export const buildEncounter = (
  overrides: Partial<Encounter> = {},
): Encounter => ({
  id: 'encounter-1',
  adventure_id: 'adventure-1',
  name: null,
  description: null,
  image_id: null,
  pinned_order: null,
  hide_defeated: 0,
  created_at: '',
  updated_at: '',
  ...overrides,
});
