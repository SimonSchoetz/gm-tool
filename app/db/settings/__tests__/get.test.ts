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

describe('getSetting', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  it('returns the parsed value for an existing key', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM settings')) {
        return Promise.resolve([{ value: '{"animation_enabled":true}' }]);
      }
      return Promise.resolve([]);
    });
    const { getSetting } = await import('../get');
    const result = await getSetting('background');
    expect(result).toEqual({ animation_enabled: true });
    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT value FROM settings WHERE id = $1',
      ['background'],
    );
  });

  it('returns null when the key does not exist', async () => {
    const { getSetting } = await import('../get');
    const result = await getSetting('background');
    expect(result).toBeNull();
  });

  it('throws when stored JSON does not match the schema', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM settings')) {
        return Promise.resolve([{ value: '{"animation_enabled":"yes"}' }]);
      }
      return Promise.resolve([]);
    });
    const { getSetting } = await import('../get');
    await expect(getSetting('background')).rejects.toThrow();
  });
});
