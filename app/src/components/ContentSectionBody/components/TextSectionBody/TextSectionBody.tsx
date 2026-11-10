import { useBaseEntityContentSections } from '@/data-access-layer';
import { TextEditor } from '@/components/TextEditor';
import { FCProps } from '@/types/fcProps.type';
import type { SectionBodyProps } from '../../types';
import { CONTENT_SECTION_EDITOR_PLACEHOLDER } from '../../ContentSectionBody.constants';
import { buildSectionTextEditorId } from '../../helper/buildSectionTextEditorId';

type Props = SectionBodyProps;

// Renders as a plain text editor; kept apart from FiveEStatBlockSectionBody, which is identical today.
export const TextSectionBody: FCProps<Props> = ({
  section,
  baseEntityId,
  readOnly,
}) => {
  const { updateSection } = useBaseEntityContentSections(baseEntityId);

  const textEditorId = buildSectionTextEditorId(
    'content-section',
    section.id,
    readOnly,
  );

  return (
    <TextEditor
      textEditorId={textEditorId}
      value={section.content ?? ''}
      readOnly={readOnly}
      {...(!readOnly && {
        placeholder: CONTENT_SECTION_EDITOR_PLACEHOLDER,
        onChange: (content: string) => {
          updateSection(section.id, { content });
        },
      })}
    />
  );
};
