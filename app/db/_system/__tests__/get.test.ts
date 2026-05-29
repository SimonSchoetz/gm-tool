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

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns the stored value for an existing key', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([{ value: 'some-json' }]);
      }
      return Promise.resolve([]);
    });
    const { get } = await import('../get');
    const result = await get('versioning');
    expect(result).toBe('some-json');
    expect(mockSelect).toHaveBeenCalledWith(
      'SELECT value FROM _system WHERE key = $1',
      ['versioning'],
    );
  });

  it('returns null when the key does not exist', async () => {
    const { get } = await import('../get');
    const result = await get('nonexistent');
    expect(result).toBeNull();
  });
});
