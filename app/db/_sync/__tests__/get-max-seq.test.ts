import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: mockExecute,
        select: mockSelect,
      }),
    ),
  },
}));

import { getMaxSeq } from '../get-max-seq';

describe('getMaxSeq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return the counter value', async () => {
    mockSelect.mockResolvedValue([{ value: 42 }]);

    const result = await getMaxSeq();

    expect(mockSelect).toHaveBeenCalledWith(
      "SELECT value FROM _sync_meta WHERE id = 'seq'",
    );
    expect(result).toBe(42);
  });

  it('should return 0 when no row exists', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await getMaxSeq();

    expect(result).toBe(0);
  });
});
