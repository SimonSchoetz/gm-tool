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

  it('throws for unknown entity types', () => {
    expect(() => buildEntityPath('stories', 'id-1', null)).toThrow(
      'buildEntityPath: unknown entityType "stories"',
    );
  });
});
