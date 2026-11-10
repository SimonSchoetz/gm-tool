import type { PairedDevice } from '@db/paired-device';

export const buildPairedDevice = (
  overrides: Partial<PairedDevice> = {},
): PairedDevice => ({
  id: 'peer-1',
  name: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});
