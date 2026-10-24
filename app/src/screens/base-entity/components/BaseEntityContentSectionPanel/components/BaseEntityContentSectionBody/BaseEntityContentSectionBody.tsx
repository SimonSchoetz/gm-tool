import { useParams } from '@tanstack/react-router';
import { useBaseEntityContentSections } from '@/data-access-layer';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import { TextEditor } from '@/components/TextEditor';
import { FCProps } from '@/types/fcProps.type';
import { BasicStatBlockSectionBody } from '../BasicStatBlockSectionBody';
import { CONTENT_SECTION_EDITOR_PLACEHOLDER } from '../../BaseEntityContentSectionPanel.constants';
import './BaseEntityContentSectionBody.css';

type Props = {
  section: BaseEntityContentSection;
  isOutgoing: boolean;
};

export const BaseEntityContentSectionBody: FCProps<Props> = ({
  section,
  isOutgoing,
}) => {
  const params = useParams({ strict: false });
  const baseEntityId = params.baseEntityId ?? '';
  const { updateSection } = useBaseEntityContentSections(baseEntityId);

  return (
    <div className='base-entity-content-section-body'>
      {section.type === 'basic-stat-block' ? (
        // Keyed by section id, so switching between two stat-block sections remounts the body and resets its HP field.
        <BasicStatBlockSectionBody key={section.id} sectionId={section.id} />
      ) : (
        // Includes the section id, so switching sections remounts TextEditor (it keys on textEditorId) instead of keeping the previous section's content.
        <TextEditor
          textEditorId={`content-section-${section.id}`}
          value={section.content ?? ''}
          placeholder={CONTENT_SECTION_EDITOR_PLACEHOLDER}
          readOnly={isOutgoing}
          {...(!isOutgoing && {
            onChange: (content: string) => {
              updateSection(section.id, { content });
            },
          })}
        />
      )}
    </div>
  );
};
