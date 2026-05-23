import { describe, it, expect } from 'vitest';
import { buildEntityPath } from '../buildEntityPath';

describe('buildEntityPath', () => {
  it('returns adventure-scoped npc path', () => {
    expect(buildEntityPath('npcs', 'npc-1', 'adv-1')).toBe(
      '/adventure/adv-1/npc/npc-1',
    );
  });

  it('returns root-scoped npc path when adventureId is null', () => {
    expect(buildEntityPath('npcs', 'npc-1', null)).toBe('/npc/npc-1');
  });

  it('returns root-scoped session path', () => {
    expect(buildEntityPath('sessions', 'sess-1', null)).toBe('/session/sess-1');
  });

  it('returns adventure-scoped foe path', () => {
    expect(buildEntityPath('foes', 'foe-1', 'adv-1')).toBe(
      '/adventure/adv-1/foe/foe-1',
    );
  });

  it('returns adventure-scoped pc path', () => {
    expect(buildEntityPath('pcs', 'pc-1', 'adv-1')).toBe(
      '/adventure/adv-1/pc/pc-1',
    );
  });

  it('returns adventure-scoped faction path', () => {
    expect(buildEntityPath('factions', 'faction-1', 'adv-1')).toBe(
      '/adventure/adv-1/faction/faction-1',
    );
  });

  it('returns adventure-scoped location path', () => {
    expect(buildEntityPath('locations', 'location-1', 'adv-1')).toBe(
      '/adventure/adv-1/location/location-1',
    );
  });

  it('returns adventure-scoped item path', () => {
    expect(buildEntityPath('items', 'item-1', 'adv-1')).toBe(
      '/adventure/adv-1/item/item-1',
    );
  });

  it('throws for unknown entity types', () => {
    expect(() => buildEntityPath('stories', 'id-1', null)).toThrow(
      'buildEntityPath: unknown entityType "stories"',
    );
  });
});
