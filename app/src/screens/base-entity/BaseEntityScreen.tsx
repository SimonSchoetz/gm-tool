import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { TextEditor } from '@/components/TextEditor';
import {
  useBaseEntity,
  useBaseEntityContentSections,
} from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { entityTypeLabel, type BaseEntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { BaseEntitySidebar } from './components/BaseEntitySidebar/BaseEntitySidebar';
import { ScreensNameInput } from '../components/ScreensNameInput/ScreensNameInput';
import { ScreensTextEditorLayout } from '../components/ScreensTextEditorLayout/ScreensTextEditorLayout';
import { ScreensSummary } from '../components/ScreensSummary/ScreensSummary';

type Props = { entityType: BaseEntityType };

export const BaseEntityScreen: FCProps<Props> = ({ entityType }) => {
  const params = useParams({ strict: false });

  const { baseEntity, updateBaseEntity, loading } = useBaseEntity(
    entityType,
    params.baseEntityId ?? '',
    params.adventureId ?? '',
  );
  const {
    summarySection,
    updateSection,
    loading: sectionsLoading,
  } = useBaseEntityContentSections(params.baseEntityId ?? '');
  const label = entityTypeLabel(entityType);

  if (loading || sectionsLoading || !baseEntity) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      sideBar={<BaseEntitySidebar entityType={entityType} />}
      header={
        summarySection ? (
          <ScreensSummary>
            <TextEditor
              placeholder={`${label} Summary`}
              value={summarySection.content ?? ''}
              textEditorId={`${entityType}_${baseEntity.id}_summary`}
              onChange={(content) => {
                updateSection(summarySection.id, { content });
              }}
            />
          </ScreensSummary>
        ) : null
      }
      body={
        <>
          <ScreensNameInput
            placeholder={`${label} Name`}
            initValue={baseEntity.name ?? ''}
            onCommit={(name) => {
              updateBaseEntity({ name });
            }}
          />
          <TextEditor
            value={baseEntity.description ?? ''}
            textEditorId={`${entityType}_${baseEntity.id}_description`}
            onChange={(description) => {
              updateBaseEntity({ description });
            }}
          />
        </>
      }
    />
  );
};
