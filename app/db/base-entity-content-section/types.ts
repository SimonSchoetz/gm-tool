import z from 'zod';
import { baseEntityContentSectionTable } from './schema';
import type { BaseEntityContentSectionType } from '@domain';

export type BaseEntityContentSection = z.infer<
  typeof baseEntityContentSectionTable.zodSchema
>;
export type CreateBaseEntityContentSectionInput = {
  base_entity_id: string;
  type: BaseEntityContentSectionType;
  sort_order: number;
  name?: string;
};
export type UpdateBaseEntityContentSectionInput = z.infer<
  typeof baseEntityContentSectionTable.updateSchema
>;
