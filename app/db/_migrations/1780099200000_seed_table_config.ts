import type Database from '@tauri-apps/plugin-sql';
import { generateId, generateDbTimestamps } from '../util';

const configs = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

const up = async (db: Database): Promise<void> => {
  for (const config of configs) {
    const id = generateId();
    const { created_at, updated_at } = generateDbTimestamps();
    const layout = JSON.stringify(config.layout);

    await db.execute(
      `INSERT OR IGNORE INTO table_config
         (id, table_name, color, layout, tagging_enabled, scope, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        config.table_name,
        config.color,
        layout,
        config.tagging_enabled,
        config.scope,
        created_at,
        updated_at,
      ],
    );
  }
};

export const seedTableConfigMigration = {
  id: '1780099200000',
  up,
};
