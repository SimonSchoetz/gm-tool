import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import { parseBasicStatBlockContent } from '@domain';

type PopupSummary = {
  summary: string | null;
  hp: { value: number | null } | null;
};

export const readPopupSummary = (
  section: BaseEntityContentSection | null,
): PopupSummary => {
  if (section === null) return { summary: null, hp: null };
  if (section.type !== 'basic-stat-block') {
    return { summary: section.content, hp: null };
  }
  const { textEditor, basicStatBlock } = parseBasicStatBlockContent(
    section.content,
  );
  return { summary: textEditor, hp: { value: basicStatBlock.hp } };
};
