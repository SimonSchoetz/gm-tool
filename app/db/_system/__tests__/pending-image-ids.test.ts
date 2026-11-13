// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PENDING_IMAGE_IDS_SYSTEM_KEY } from '@domain';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const readStoredValue = async () => {
  const { getDatabase } = await import('@db/database');
  const rows = await (
    await getDatabase()
  ).select<{ value: string | null }[]>(
    'SELECT value FROM _system WHERE id = $1',
    [PENDING_IMAGE_IDS_SYSTEM_KEY],
  );
  return rows[0]?.value ?? null;
};

describe('pending image ids', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('holds no id on a fresh database', async () => {
    const { getPendingImageIds } = await import('../pending-image-ids');

    expect(await getPendingImageIds()).toEqual([]);
    expect(await readStoredValue()).toBeNull();
  });

  it('keeps every id two additions recorded, each once, and drops only the ids removed', async () => {
    const { addPendingImageIds, removePendingImageIds, getPendingImageIds } =
      await import('../pending-image-ids');

    await addPendingImageIds(['a', 'b']);
    await addPendingImageIds(['b', 'c']);
    expect((await getPendingImageIds()).sort()).toEqual(['a', 'b', 'c']);

    await removePendingImageIds(['a', 'c', 'never-recorded']);
    expect(await getPendingImageIds()).toEqual(['b']);
  });

  it('keeps the ids of two additions made at the same time', async () => {
    const { addPendingImageIds, getPendingImageIds } =
      await import('../pending-image-ids');

    await Promise.all([addPendingImageIds(['a']), addPendingImageIds(['b'])]);

    expect((await getPendingImageIds()).sort()).toEqual(['a', 'b']);
  });

  it('writes nothing for an empty addition or removal, and removes from a missing list without creating it', async () => {
    const { addPendingImageIds, removePendingImageIds } =
      await import('../pending-image-ids');

    await removePendingImageIds(['a']);
    await addPendingImageIds([]);
    expect(await readStoredValue()).toBeNull();

    await addPendingImageIds(['a']);
    await removePendingImageIds([]);
    expect(JSON.parse((await readStoredValue()) ?? 'null')).toEqual(['a']);
  });

  it('leaves the other `_system` rows unchanged', async () => {
    const { addPendingImageIds, removePendingImageIds } =
      await import('../pending-image-ids');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    const otherRows = () =>
      db.select<unknown[]>('SELECT * FROM _system WHERE id != $1 ORDER BY id', [
        PENDING_IMAGE_IDS_SYSTEM_KEY,
      ]);
    const before = await otherRows();

    await addPendingImageIds(['a']);
    await removePendingImageIds(['a']);

    expect(await otherRows()).toEqual(before);
  });
});
