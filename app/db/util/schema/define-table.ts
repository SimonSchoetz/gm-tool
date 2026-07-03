import { z } from 'zod';

type ColumnType = 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB';

type ColumnDefinition = {
  type: ColumnType;
  primaryKey?: boolean;
  notNull?: boolean;
  default?: string;
  foreignKey?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
  zod: z.ZodType;
  updateZod?: z.ZodType;
};

type TableDefinition = {
  name: string;
  columns: Record<string, ColumnDefinition>;
};

type ExtractZodShape<T extends Record<string, ColumnDefinition>> = {
  [K in keyof T]: T[K]['zod'];
};

type ExtractUpdateShape<T extends Record<string, ColumnDefinition>> = {
  [
    K in keyof T as T[K]['primaryKey'] extends true
      ? never
      : K extends 'created_at' | 'updated_at'
        ? never
        : K
  ]: T[K] extends { updateZod: z.ZodType }
    ? z.ZodOptional<T[K]['updateZod']>
    : z.ZodOptional<T[K]['zod']>;
};

type TableSchema<T extends TableDefinition> = {
  name: T['name'];
  createTableSQL: string;
  zodSchema: z.ZodObject<ExtractZodShape<T['columns']>>;
  updateSchema: z.ZodObject<ExtractUpdateShape<T['columns']>>;
};

export const defineTable = <T extends TableDefinition>(
  definition: T,
): TableSchema<T> => {
  const { name, columns } = definition;

  return {
    name,
    createTableSQL: generateCreateTableSQL(name, columns),
    zodSchema: generateZodSchema(columns) as z.ZodObject<
      ExtractZodShape<T['columns']>
    >,
    updateSchema: generateUpdateSchema(columns) as z.ZodObject<
      ExtractUpdateShape<T['columns']>
    >,
  };
};

const generateCreateTableSQL = (
  name: string,
  columns: Record<string, ColumnDefinition>,
): string => {
  const columnDefs: string[] = [];
  const foreignKeys: string[] = [];

  for (const [columnName, columnDef] of Object.entries(columns)) {
    const parts: string[] = [columnName, columnDef.type];

    if (columnDef.primaryKey) parts.push('PRIMARY KEY');
    if (columnDef.notNull) parts.push('NOT NULL');
    if (columnDef.default) parts.push(`DEFAULT ${columnDef.default}`);

    columnDefs.push(parts.join(' '));

    if (columnDef.foreignKey) {
      const { table, column, onDelete } = columnDef.foreignKey;
      const fk = `FOREIGN KEY (${columnName}) REFERENCES ${table}(${column})`;
      foreignKeys.push(onDelete ? `${fk} ON DELETE ${onDelete}` : fk);
    }
  }

  const allDefs = [...columnDefs, ...foreignKeys];

  return `
  CREATE TABLE IF NOT EXISTS ${name} (
    ${allDefs.join(',\n    ')}
  )
`;
};

const generateZodSchema = (columns: Record<string, ColumnDefinition>) => {
  const zodSchemaShape: Record<string, z.ZodType> = {};
  for (const [columnName, columnDef] of Object.entries(columns)) {
    zodSchemaShape[columnName] = columnDef.zod;
  }

  return z.object(zodSchemaShape);
};

const generateUpdateSchema = (columns: Record<string, ColumnDefinition>) => {
  const updateSchemaShape: Record<string, z.ZodType> = {};
  for (const [columnName, columnDef] of Object.entries(columns)) {
    if (
      !columnDef.primaryKey &&
      columnName !== 'created_at' &&
      columnName !== 'updated_at'
    ) {
      const zodSchema = columnDef.updateZod ?? columnDef.zod;
      updateSchemaShape[columnName] = zodSchema.optional();
    }
  }
  return z.object(updateSchemaShape).partial();
};
