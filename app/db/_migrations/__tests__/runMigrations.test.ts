import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigrations } from '../index';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

describe('runMigrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockResolvedValue([]);
  });

  it('propagates migration.up() errors without writing a ledger row', async () => {
    const migrationError = new Error('migration failed');

    mockExecute.mockResolvedValueOnce(undefined); // CREATE TABLE IF NOT EXISTS _migrations
    mockExecute.mockRejectedValueOnce(migrationError); // first execute inside migration.up()

    const mockDb = {
      execute: mockExecute,
      select: mockSelect,
    } as unknown as Parameters<typeof runMigrations>[0];

    await expect(runMigrations(mockDb)).rejects.toThrow('migration failed');

    const callArgs = mockExecute.mock.calls.map((call) => call[0] as string);
    expect(callArgs).not.toContain('BEGIN');
    expect(callArgs).not.toContain('COMMIT');
    expect(callArgs).not.toContain('ROLLBACK');
    expect(
      callArgs.some((arg) => arg.startsWith('INSERT INTO _migrations')),
    ).toBe(false);
  });
});
