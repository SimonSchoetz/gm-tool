import { describe, it, expect, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(),
  },
}));

import { getAll } from '../get-all';

describe('getAll', () => {
  it('should throw error when limit is too large', async () => {
    await expect(getAll({ limit: 101 })).rejects.toThrow(
      'Limit must be between 1 and 100'
    );
  });

  it('should throw error when offset is negative', async () => {
    await expect(getAll({ offset: -1 })).rejects.toThrow(
      'Offset must be non-negative'
    );
  });
});

