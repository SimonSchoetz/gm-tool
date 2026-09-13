import { LoadingIcon, TextEditor } from '@/components';
import { useBaseEntity } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { entityTypeLabel, type BaseEntityType } from '@domain';
import { FCProps } from '@/types';
import { BaseEntitySidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

type Props = { entityType: BaseEntityType };

export const BaseEntityScreen: FCProps<Props> = ({ entityType }) => {
  const params = useParams({ strict: false });

  const { baseEntity, updateBaseEntity, loading } = useBaseEntity(
    entityType,
    params.baseEntityId ?? '',
    params.adventureId ?? '',
  );
  const label = entityTypeLabel(entityType);

  if (loading || !baseEntity) {
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
        <ScreensSummary>
          <TextEditor
            placeholder={`${label} Summary`}
            value={baseEntity.summary ?? ''}
            textEditorId={`${entityType}_${baseEntity.id}_summary`}
            onChange={(summary) => {
              updateBaseEntity({ summary });
            }}
          />
        </ScreensSummary>
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
