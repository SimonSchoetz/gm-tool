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

import { create } from '../create';

const hexId =
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should insert with the supplied EndpointId and return it', async () => {
    const deviceId = await create({ id: hexId, name: 'Laptop' });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO paired_devices'),
      expect.arrayContaining([hexId]),
    );
    expect(deviceId).toBe(hexId);
  });

  it('should set created_at and updated_at as ISO 8601 timestamps', async () => {
    await create({ id: hexId, name: 'Laptop' });

    const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(values.at(-2)).toBe('2024-01-15T10:30:00.000Z');
    expect(values.at(-1)).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should reject an id that fails the 64-char hex regex', async () => {
    await expect(create({ id: 'short', name: null })).rejects.toThrow();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('should accept name null', async () => {
    await create({ id: hexId, name: null });

    const [, values] = mockExecute.mock.calls[0] as [string, unknown[]];
    expect(values).toContain(null);
  });
});
