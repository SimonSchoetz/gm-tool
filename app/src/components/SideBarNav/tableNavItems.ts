import type { TableNavItem } from './components/TableNavItem/TableNavItem';

type TableNavItemConfig = Omit<
  React.ComponentProps<typeof TableNavItem>,
  'isDisabled'
>;

export const TABLE_NAV_ITEMS: TableNavItemConfig[] = [
  {
    label: 'Sessions',
    to: '/adventure/$adventureId/sessions',
    tableName: 'sessions',
  },
  {
    label: 'Encounters',
    to: '/adventure/$adventureId/encounters',
    tableName: 'encounters',
  },
  { label: 'PCs', to: '/adventure/$adventureId/pcs', tableName: 'pcs' },
  { label: 'NPCs', to: '/adventure/$adventureId/npcs', tableName: 'npcs' },
  {
    label: 'Factions',
    to: '/adventure/$adventureId/factions',
    tableName: 'factions',
  },
  {
    label: 'Locations',
    to: '/adventure/$adventureId/locations',
    tableName: 'locations',
  },
  { label: 'Foes', to: '/adventure/$adventureId/foes', tableName: 'foes' },
  { label: 'Items', to: '/adventure/$adventureId/items', tableName: 'items' },
];
