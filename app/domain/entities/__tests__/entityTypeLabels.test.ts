import { describe, it, expect } from 'vitest';
import { entityTypeLabel } from '../entityTypeLabels';

describe('entityTypeLabel', () => {
  it('returns the display label for each known entity type', () => {
    expect(entityTypeLabel('npcs')).toBe('NPC');
    expect(entityTypeLabel('foes')).toBe('Foe');
    expect(entityTypeLabel('pcs')).toBe('PC');
    expect(entityTypeLabel('factions')).toBe('Faction');
    expect(entityTypeLabel('locations')).toBe('Location');
    expect(entityTypeLabel('items')).toBe('Item');
    expect(entityTypeLabel('sessions')).toBe('Session');
    expect(entityTypeLabel('adventures')).toBe('Adventure');
  });

  it("returns 'Entity' for an unrecognized entity type", () => {
    expect(entityTypeLabel('stories')).toBe('Entity');
  });
});
