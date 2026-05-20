import { describe, expect, it } from 'vitest';
import { AnyRouteMatch } from '@tanstack/react-router';
import { buildBreadcrumbs } from '../buildBreadcrumbs';

const match = (
  routeId: string,
  params: Record<string, string> = {},
): AnyRouteMatch => ({ routeId, params }) as unknown as AnyRouteMatch;

describe('buildBreadcrumbs', () => {
  it('filters __root__ and / matches', () => {
    const result = buildBreadcrumbs([match('__root__'), match('/')]);
    expect(result).toHaveLength(0);
  });

  it('maps /adventures to a single static Adventures item', () => {
    const result = buildBreadcrumbs([match('__root__'), match('/adventures')]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      kind: 'static',
      label: 'Adventures',
      to: '/adventures',
      params: {},
    });
  });

  it('maps /settings to a single static Settings item', () => {
    const result = buildBreadcrumbs([match('__root__'), match('/settings')]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      kind: 'static',
      label: 'Settings',
      to: '/settings',
      params: {},
    });
  });

  it('maps /adventure/$adventureId to Adventures static + adventure crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv1' }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      kind: 'static',
      label: 'Adventures',
      to: '/adventures',
      params: {},
    });
    expect(result[1]).toEqual({ kind: 'adventure' });
  });

  it('maps /adventure/$adventureId/npcs to Adventures + adventure + NPCs static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv1' }),
      match('/adventure/$adventureId/npcs', { adventureId: 'adv1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'NPCs',
      to: '/adventure/$adventureId/npcs',
      params: { adventureId: 'adv1' },
    });
  });

  it('maps /adventure/$adventureId/npc/$npcId to Adventures + adventure + NPCs + npc crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv1' }),
      match('/adventure/$adventureId/npc/$npcId', {
        adventureId: 'adv1',
        npcId: 'npc1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'NPCs',
      to: '/adventure/$adventureId/npcs',
      params: { adventureId: 'adv1' },
    });
    expect(result[3]).toEqual({ kind: 'npc' });
  });

  it('maps /adventure/$adventureId/sessions to Adventures + adventure + Sessions static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv1' }),
      match('/adventure/$adventureId/sessions', { adventureId: 'adv1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Sessions',
      to: '/adventure/$adventureId/sessions',
      params: { adventureId: 'adv1' },
    });
  });

  it('maps /adventure/$adventureId/session/$sessionId to Adventures + adventure + Sessions + session crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv1' }),
      match('/adventure/$adventureId/session/$sessionId', {
        adventureId: 'adv1',
        sessionId: 'sess1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Sessions',
      to: '/adventure/$adventureId/sessions',
      params: { adventureId: 'adv1' },
    });
    expect(result[3]).toEqual({ kind: 'session' });
  });

  it('maps /adventure/$adventureId/foes to Foes static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/foes', { adventureId: 'adv-1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Foes',
      to: '/adventure/$adventureId/foes',
      params: { adventureId: 'adv-1' },
    });
  });

  it('maps /adventure/$adventureId/foe/$foeId to Foes static + foe crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/foe/$foeId', {
        adventureId: 'adv-1',
        foeId: 'foe-1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Foes',
      to: '/adventure/$adventureId/foes',
      params: { adventureId: 'adv-1' },
    });
    expect(result[3]).toEqual({ kind: 'foe' });
  });

  it('maps /adventure/$adventureId/pcs to PCs static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/pcs', { adventureId: 'adv-1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'PCs',
      to: '/adventure/$adventureId/pcs',
      params: { adventureId: 'adv-1' },
    });
  });

  it('maps /adventure/$adventureId/pc/$pcId to PCs static + pc crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/pc/$pcId', {
        adventureId: 'adv-1',
        pcId: 'pc-1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'PCs',
      to: '/adventure/$adventureId/pcs',
      params: { adventureId: 'adv-1' },
    });
    expect(result[3]).toEqual({ kind: 'pc' });
  });

  it('maps /adventure/$adventureId/factions to Factions static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/factions', { adventureId: 'adv-1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Factions',
      to: '/adventure/$adventureId/factions',
      params: { adventureId: 'adv-1' },
    });
  });

  it('maps /adventure/$adventureId/faction/$factionId to Factions static + faction crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/faction/$factionId', {
        adventureId: 'adv-1',
        factionId: 'faction-1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Factions',
      to: '/adventure/$adventureId/factions',
      params: { adventureId: 'adv-1' },
    });
    expect(result[3]).toEqual({ kind: 'faction' });
  });

  it('maps /adventure/$adventureId/locations to Locations static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/locations', { adventureId: 'adv-1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Locations',
      to: '/adventure/$adventureId/locations',
      params: { adventureId: 'adv-1' },
    });
  });

  it('maps /adventure/$adventureId/location/$locationId to Locations static + location crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/location/$locationId', {
        adventureId: 'adv-1',
        locationId: 'location-1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Locations',
      to: '/adventure/$adventureId/locations',
      params: { adventureId: 'adv-1' },
    });
    expect(result[3]).toEqual({ kind: 'location' });
  });

  it('maps /adventure/$adventureId/items to Items static', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/items', { adventureId: 'adv-1' }),
    ]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Items',
      to: '/adventure/$adventureId/items',
      params: { adventureId: 'adv-1' },
    });
  });

  it('maps /adventure/$adventureId/item/$itemId to Items static + item crumb', () => {
    const result = buildBreadcrumbs([
      match('__root__'),
      match('/adventure/$adventureId', { adventureId: 'adv-1' }),
      match('/adventure/$adventureId/item/$itemId', {
        adventureId: 'adv-1',
        itemId: 'item-1',
      }),
    ]);
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({
      kind: 'static',
      label: 'Items',
      to: '/adventure/$adventureId/items',
      params: { adventureId: 'adv-1' },
    });
    expect(result[3]).toEqual({ kind: 'item' });
  });

  it('silently ignores unknown routeIds', () => {
    const result = buildBreadcrumbs([match('/unknown-route')]);
    expect(result).toHaveLength(0);
  });
});
