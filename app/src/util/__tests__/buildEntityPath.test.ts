import { describe, it, expect } from 'vitest';
import { buildEntityPath } from '../buildEntityPath';

describe('buildEntityPath', () => {
  it('returns adventure-scoped path when adventureId is provided', () => {
    expect(buildEntityPath('npcs', 'npc-1', 'adv-1')).toBe(
      '/adventure/adv-1/npc/npc-1',
    );
  });

  it('returns root-scoped path when adventureId is null', () => {
    expect(buildEntityPath('npcs', 'npc-1', null)).toBe('/npc/npc-1');
  });

  it('strips trailing s to form the entity segment', () => {
    expect(buildEntityPath('sessions', 'sess-1', null)).toBe('/session/sess-1');
  });
});
