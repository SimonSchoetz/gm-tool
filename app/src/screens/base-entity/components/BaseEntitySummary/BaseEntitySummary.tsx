import { useParams } from '@tanstack/react-router';
import { useBaseEntityContentSections } from '@/data-access-layer';
import { entityTypeLabel, type BaseEntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { PanelMenuBar } from '@/components/PanelMenuBar/PanelMenuBar';
import { PanelBody } from '@/components/PanelBody/PanelBody';
import { TextEditor } from '@/components/TextEditor';
import './BaseEntitySummary.css';

type Props = { entityType: BaseEntityType };

export const BaseEntitySummary: FCProps<Props> = ({ entityType }) => {
  const params = useParams({ strict: false });
  const baseEntityId = params.baseEntityId ?? '';

  const { summarySection, updateSection, loading } =
    useBaseEntityContentSections(baseEntityId);

  if (loading) return;

  return (
    <GlassPanel intensity='bright' className='base-entity-summary'>
      <PanelMenuBar
        title={summarySection ? (summarySection.name ?? '') : 'Content Section'}
      />
      {summarySection && (
        <PanelBody>
          <div className='base-entity-summary-content'>
            <TextEditor
              placeholder={`${entityTypeLabel(entityType)} Summary`}
              value={summarySection.content ?? ''}
              textEditorId={`${entityType}_${baseEntityId}_summary`}
              onChange={(content) => {
                updateSection(summarySection.id, { content });
              }}
            />
          </div>
        </PanelBody>
      )}
    </GlassPanel>
  );
};
