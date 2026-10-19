import type { BaseEntityContentSectionType } from './contentSectionTypes';

const CONTENT_SECTION_TYPE_LABELS: Record<
  BaseEntityContentSectionType,
  string
> = {
  text: 'Text',
  'basic-stat-block': 'Basic Stat Block',
  '5e-stat-block': '5e Stat Block',
};

export const contentSectionTypeLabel = (
  type: BaseEntityContentSectionType,
): string => CONTENT_SECTION_TYPE_LABELS[type];

export const contentSectionLabel = (
  name: string | null,
  type: BaseEntityContentSectionType,
): string =>
  name === null || name === '' ? contentSectionTypeLabel(type) : name;
