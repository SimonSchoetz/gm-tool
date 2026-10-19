import type { z } from 'zod';
import { basicStatBlockContentSchema } from './basicStatBlockContent';
import type { BaseEntityContentSectionType } from './contentSectionTypes';

// `null` marks content whose shape this app does not define (Lexical editor state), stored validated only as a string.
const CONTENT_SECTION_CONTENT_SCHEMAS: Record<
  BaseEntityContentSectionType,
  z.ZodType | null
> = {
  text: null,
  'basic-stat-block': basicStatBlockContentSchema,
  '5e-stat-block': null,
};

export const assertValidContentSectionContent = (
  type: BaseEntityContentSectionType,
  content: string,
): void => {
  const schema = CONTENT_SECTION_CONTENT_SCHEMAS[type];
  if (schema === null) {
    return;
  }
  const parsed: unknown = JSON.parse(content);
  schema.parse(parsed);
};
