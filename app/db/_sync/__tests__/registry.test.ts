import { describe, it, expect } from 'vitest';
import { SYNCED_TABLES, SYNCED_TABLE_NAMES } from '../registry';

const ADVENTURE_SCOPED_TABLES = [
  'sessions',
  'npcs',
  'pcs',
  'foes',
  'factions',
  'locations',
  'items',
];

describe('registry', () => {
  it('should order images before adventures', () => {
    expect(SYNCED_TABLE_NAMES.indexOf('images')).toBeLessThan(
      SYNCED_TABLE_NAMES.indexOf('adventures'),
    );
  });

  it('should order adventures before every adventure-scoped table', () => {
    const adventuresIndex = SYNCED_TABLE_NAMES.indexOf('adventures');
    for (const tableName of ADVENTURE_SCOPED_TABLES) {
      expect(adventuresIndex).toBeLessThan(
        SYNCED_TABLE_NAMES.indexOf(tableName),
      );
    }
  });

  it('should order sessions before session_steps', () => {
    expect(SYNCED_TABLE_NAMES.indexOf('sessions')).toBeLessThan(
      SYNCED_TABLE_NAMES.indexOf('session_steps'),
    );
  });

  it('should include all 11 synced tables with unique names', () => {
    expect(SYNCED_TABLE_NAMES).toHaveLength(11);
    expect(new Set(SYNCED_TABLE_NAMES).size).toBe(11);
  });

  it('should include id and updated_at in every table entry', () => {
    for (const table of SYNCED_TABLES) {
      expect(table.columns).toContain('id');
      expect(table.columns).toContain('updated_at');
    }
  });
});
