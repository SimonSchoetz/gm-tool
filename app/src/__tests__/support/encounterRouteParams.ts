export const ROUTE_ADVENTURE_ID = 'adventure-1';
export const ROUTE_ENCOUNTER_ID = 'encounter-1';

// Stands in for `useParams` of `@tanstack/react-router` in a component test: like the router, it answers the params of the route named by `from` and nothing for another route, so a component that names the wrong route reads no id.
export const encounterRouteParams = ({ from }: { from: string }) =>
  from === '/adventure/$adventureId/encounter/$encounterId'
    ? { adventureId: ROUTE_ADVENTURE_ID, encounterId: ROUTE_ENCOUNTER_ID }
    : {};
