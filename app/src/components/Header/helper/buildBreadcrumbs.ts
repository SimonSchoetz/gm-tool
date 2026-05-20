import { AnyRouteMatch } from '@tanstack/react-router';

export type BreadcrumbConfig =
  | {
      kind: 'static';
      label: string;
      to: string;
      params: Record<string, string>;
    }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' }
  | { kind: 'foe' }
  | { kind: 'faction' }
  | { kind: 'pc' }
  | { kind: 'location' };

export const buildBreadcrumbs = (
  matches: AnyRouteMatch[],
): BreadcrumbConfig[] =>
  matches.flatMap((match): BreadcrumbConfig[] => {
    if (match.routeId === '__root__' || match.routeId === '/') return [];

    const p = match.params as Record<string, string>;

    switch (match.routeId) {
      case '/adventures':
        return [
          {
            kind: 'static',
            label: 'Adventures',
            to: '/adventures',
            params: {},
          },
        ];
      case '/settings':
        return [
          { kind: 'static', label: 'Settings', to: '/settings', params: {} },
        ];
      case '/adventure/$adventureId':
        return [
          {
            kind: 'static',
            label: 'Adventures',
            to: '/adventures',
            params: {},
          },
          { kind: 'adventure' },
        ];
      case '/adventure/$adventureId/npcs':
        return [
          {
            kind: 'static',
            label: 'NPCs',
            to: '/adventure/$adventureId/npcs',
            params: { adventureId: p.adventureId },
          },
        ];
      case '/adventure/$adventureId/npc/$npcId':
        return [
          {
            kind: 'static',
            label: 'NPCs',
            to: '/adventure/$adventureId/npcs',
            params: { adventureId: p.adventureId },
          },
          { kind: 'npc' },
        ];
      case '/adventure/$adventureId/foes':
        return [
          {
            kind: 'static',
            label: 'Foes',
            to: '/adventure/$adventureId/foes',
            params: { adventureId: p.adventureId },
          },
        ];
      case '/adventure/$adventureId/foe/$foeId':
        return [
          {
            kind: 'static',
            label: 'Foes',
            to: '/adventure/$adventureId/foes',
            params: { adventureId: p.adventureId },
          },
          { kind: 'foe' },
        ];
      case '/adventure/$adventureId/factions':
        return [
          {
            kind: 'static',
            label: 'Factions',
            to: '/adventure/$adventureId/factions',
            params: { adventureId: p.adventureId },
          },
        ];
      case '/adventure/$adventureId/faction/$factionId':
        return [
          {
            kind: 'static',
            label: 'Factions',
            to: '/adventure/$adventureId/factions',
            params: { adventureId: p.adventureId },
          },
          { kind: 'faction' },
        ];
      case '/adventure/$adventureId/pcs':
        return [
          {
            kind: 'static',
            label: 'PCs',
            to: '/adventure/$adventureId/pcs',
            params: { adventureId: p.adventureId },
          },
        ];
      case '/adventure/$adventureId/pc/$pcId':
        return [
          {
            kind: 'static',
            label: 'PCs',
            to: '/adventure/$adventureId/pcs',
            params: { adventureId: p.adventureId },
          },
          { kind: 'pc' },
        ];
      case '/adventure/$adventureId/sessions':
        return [
          {
            kind: 'static',
            label: 'Sessions',
            to: '/adventure/$adventureId/sessions',
            params: { adventureId: p.adventureId },
          },
        ];
      case '/adventure/$adventureId/session/$sessionId':
        return [
          {
            kind: 'static',
            label: 'Sessions',
            to: '/adventure/$adventureId/sessions',
            params: { adventureId: p.adventureId },
          },
          { kind: 'session' },
        ];
      case '/adventure/$adventureId/locations':
        return [
          {
            kind: 'static',
            label: 'Locations',
            to: '/adventure/$adventureId/locations',
            params: { adventureId: p.adventureId },
          },
        ];
      case '/adventure/$adventureId/location/$locationId':
        return [
          {
            kind: 'static',
            label: 'Locations',
            to: '/adventure/$adventureId/locations',
            params: { adventureId: p.adventureId },
          },
          { kind: 'location' },
        ];
      default:
        return [];
    }
  });
