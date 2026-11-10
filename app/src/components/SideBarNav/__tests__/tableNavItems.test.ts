import { describe, expect, it } from 'vitest';
import { TABLE_NAV_ITEMS } from '../tableNavItems';

describe('TABLE_NAV_ITEMS', () => {
  it('names each of the eight tables once, since the table name is the list key', () => {
    const tableNames = TABLE_NAV_ITEMS.map((item) => item.tableName);

    expect(tableNames).toHaveLength(8);
    expect(new Set(tableNames).size).toBe(tableNames.length);
  });

  it('links each item to the adventure route of its own table', () => {
    for (const { to, tableName } of TABLE_NAV_ITEMS) {
      expect(to).toBe(`/adventure/$adventureId/${tableName}`);
    }
  });

  it('labels each item with the name of its own table', () => {
    for (const { label, tableName } of TABLE_NAV_ITEMS) {
      expect(label.toLowerCase()).toBe(tableName);
    }
  });
});
