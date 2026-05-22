import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigrations } from '../index';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

describe('runMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
  });

  it('should call ROLLBACK and re-throw when migration.up() throws', async () => {
    const migrationError = new Error('migration failed');

    mockExecute.mockResolvedValueOnce(undefined); // BEGIN
    mockExecute.mockRejectedValueOnce(migrationError); // first db.execute inside up()
    mockExecute.mockResolvedValueOnce(undefined); // ROLLBACK

    const mockDb = {
      execute: mockExecute,
      select: mockSelect,
    } as unknown as Parameters<typeof runMigrations>[0];

    await expect(runMigrations(mockDb)).rejects.toThrow('migration failed');

    const callArgs = mockExecute.mock.calls.map((call) => call[0] as string);
    const beginIndex = callArgs.findIndex((arg) => arg === 'BEGIN');
    const rollbackIndex = callArgs.findIndex((arg) => arg === 'ROLLBACK');

    expect(beginIndex).toBeGreaterThanOrEqual(0);
    expect(rollbackIndex).toBeGreaterThanOrEqual(0);
    expect(beginIndex).toBeLessThan(rollbackIndex);
    expect(callArgs).not.toContain('COMMIT');
  });
});
