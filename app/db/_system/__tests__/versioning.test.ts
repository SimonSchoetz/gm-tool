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

describe('versioning', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ lastInsertId: 0 });
    mockSelect.mockResolvedValue([]);
  });

  it('getVersioning returns parsed VersioningData when the row exists', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([{ value: '{"snoozed_update_version":null}' }]);
      }
      return Promise.resolve([]);
    });
    const { getVersioning } = await import('../versioning');
    const result = await getVersioning();
    expect(result).toEqual({ snoozed_update_version: null });
  });

  it('getVersioning returns null when no row exists for the key', async () => {
    // beforeEach default: mockSelect.mockResolvedValue([]) — no row returned
    const { getVersioning } = await import('../versioning');
    const result = await getVersioning();
    expect(result).toBeNull();
  });

  it('getVersioning returns null when the row exists but its value is SQL NULL', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([{ value: null }]);
      }
      return Promise.resolve([]);
    });
    const { getVersioning } = await import('../versioning');
    const result = await getVersioning();
    expect(result).toBeNull();
  });

  it('getVersioning throws when the stored JSON does not match the schema', async () => {
    mockSelect.mockImplementation((query: string) => {
      if (query.includes('SELECT value FROM _system')) {
        return Promise.resolve([{ value: '{"wrong_field":true}' }]);
      }
      return Promise.resolve([]);
    });
    const { getVersioning } = await import('../versioning');
    await expect(getVersioning()).rejects.toThrow();
  });

  it('updateVersioning serializes and writes null snoozed_update_version', async () => {
    const { updateVersioning } = await import('../versioning');
    await updateVersioning({ snoozed_update_version: null });
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
      ['versioning', '{"snoozed_update_version":null}'],
    );
  });

  it('updateVersioning serializes and writes a version string', async () => {
    const { updateVersioning } = await import('../versioning');
    await updateVersioning({ snoozed_update_version: '1.2.3' });
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
      ['versioning', '{"snoozed_update_version":"1.2.3"}'],
    );
  });
});
