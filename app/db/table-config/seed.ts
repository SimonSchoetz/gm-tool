import type Database from '@tauri-apps/plugin-sql';
import type { Adventure } from '@db/adventure';
import type { Npc } from '@db/npc';
import type { Foe } from '@db/foe';
import type { Item } from '@db/item';
import type { Location } from '@db/location';
import type { Faction } from '@db/faction';
import type { Pc } from '@db/pc';
import type { Session } from '@db/session';
import { create } from './create';
import type {
  CreateTableConfigInput,
  TypedCreateTableConfigInput,
} from './types';

const adventuresConfig: TypedCreateTableConfigInput<Adventure> = {
  table_name: 'adventures',
  color: '248, 255, 255',
  tagging_enabled: 0,
  scope: 'global',
  layout: {
    searchable_columns: ['name', 'description'],
    columns: [
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const npcsConfig: TypedCreateTableConfigInput<Npc> = {
  table_name: 'npcs',
  color: '222, 56, 255',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const foesConfig: TypedCreateTableConfigInput<Foe> = {
  table_name: 'foes',
  color: '234, 77, 77',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const itemsConfig: TypedCreateTableConfigInput<Item> = {
  table_name: 'items',
  color: '206, 194, 59',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const locationsConfig: TypedCreateTableConfigInput<Location> = {
  table_name: 'locations',
  color: '46, 204, 113',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const factionsConfig: TypedCreateTableConfigInput<Faction> = {
  table_name: 'factions',
  color: '26, 136, 255',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const pcsConfig: TypedCreateTableConfigInput<Pc> = {
  table_name: 'pcs',
  color: '0, 189, 151',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const sessionsConfig: TypedCreateTableConfigInput<Session> = {
  table_name: 'sessions',
  color: '248, 255, 255',
  tagging_enabled: 0,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'description'],
    columns: [
      { key: 'name', label: 'Name', width: 250 },
      { key: 'session_date', label: 'Session Date', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};

const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  sessionsConfig,
  pcsConfig,
  npcsConfig,
  factionsConfig,
  locationsConfig,
  foesConfig,
  itemsConfig,
];

export const seedTableConfig = async (database: Database) => {
  for (const config of defaultConfigs) {
    const existing = await database.select<{ id: string }[]>(
      'SELECT id FROM table_config WHERE table_name = $1',
      [config.table_name],
    );

    if (existing.length === 0) {
      await create(config);
      console.log(`Seeded table_config: ${config.table_name}`);
    }
  }
};
