import { describe, it, expect, beforeEach, vi } from 'vitest';

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

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  it('inserts a new row', async () => {
    const { update } = await import('../update');
    await update('versioning', null);
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
      ['versioning', null],
    );
  });

  it('replaces an existing row', async () => {
    const { update } = await import('../update');
    await update('versioning', '{"snoozed_update_version":"1.2.3"}');
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
      ['versioning', '{"snoozed_update_version":"1.2.3"}'],
    );
  });
});
