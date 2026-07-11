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

const hexId =
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

describe('device', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  it('getDevice returns parsed DeviceData when the row exists', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([
          { value: `{"id":"${hexId}","name":"Laptop"}` },
        ]);
      }
      return Promise.resolve([]);
    });
    const { getDevice } = await import('../device');
    const result = await getDevice();
    expect(result).toEqual({ id: hexId, name: 'Laptop' });
  });

  it('getDevice returns null when no row exists for the key', async () => {
    // beforeEach default: mockSelect.mockResolvedValue([]) — no row returned
    const { getDevice } = await import('../device');
    const result = await getDevice();
    expect(result).toBeNull();
  });

  it('getDevice returns null when the row exists but its value is SQL NULL', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([{ value: null }]);
      }
      return Promise.resolve([]);
    });
    const { getDevice } = await import('../device');
    const result = await getDevice();
    expect(result).toBeNull();
  });

  it('getDevice throws when the stored JSON does not match the schema', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([{ value: '{"id":"not-hex","name":null}' }]);
      }
      return Promise.resolve([]);
    });
    const { getDevice } = await import('../device');
    await expect(getDevice()).rejects.toThrow();
  });

  it('updateDevice writes the JSON-serialized value under the device key', async () => {
    const { updateDevice } = await import('../device');
    await updateDevice({ id: hexId, name: 'Laptop' });
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO _system'),
      ['device', `{"id":"${hexId}","name":"Laptop"}`],
    );
  });
});
