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

describe('set', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('inserts a new row', async () => {
    const { set } = await import('../set');
    await set('versioning', null);
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO _system (key, value) VALUES ($1, $2)',
      ['versioning', null],
    );
  });

  it('replaces an existing row', async () => {
    const { set } = await import('../set');
    await set('versioning', '{"snoozed_update_version":"1.2.3"}');
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO _system (key, value) VALUES ($1, $2)',
      ['versioning', '{"snoozed_update_version":"1.2.3"}'],
    );
  });
});
