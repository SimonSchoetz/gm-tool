import {
  contentSectionTypeLabel,
  type BaseEntityContentSectionType,
} from '@domain';

export const getSectionNamePlaceholder = (
  type: BaseEntityContentSectionType | null,
): string => (type === null ? '' : contentSectionTypeLabel(type));
