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

describe('updateSetting', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  it('writes the JSON-serialised value with INSERT OR REPLACE', async () => {
    const { updateSetting } = await import('../update');
    await updateSetting('background', { animation_enabled: false });
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO settings (id, value) VALUES ($1, $2)',
      ['background', '{"animation_enabled":false}'],
    );
  });

  it('throws when the value does not match the schema', async () => {
    const { updateSetting } = await import('../update');
    await expect(
      updateSetting('background', { animation_enabled: 'yes' } as never),
    ).rejects.toThrow();
    expect(mockExecute).not.toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO settings (id, value) VALUES ($1, $2)',
      expect.anything(),
    );
  });
});
