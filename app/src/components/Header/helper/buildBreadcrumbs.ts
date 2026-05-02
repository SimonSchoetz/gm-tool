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
  | { kind: 'npc' };

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
      default:
        return [];
    }
  });
