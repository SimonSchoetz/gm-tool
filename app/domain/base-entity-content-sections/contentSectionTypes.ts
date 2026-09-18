export const BASE_ENTITY_CONTENT_SECTION_TYPES = [
  'text',
  '5e-stat-block',
] as const;

export type BaseEntityContentSectionType =
  (typeof BASE_ENTITY_CONTENT_SECTION_TYPES)[number];
