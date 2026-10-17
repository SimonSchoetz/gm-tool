import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { TextEditor } from '@/components/TextEditor';
import { useBaseEntity } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { entityTypeLabel, type BaseEntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { BaseEntitySidebar } from './components/BaseEntitySidebar/BaseEntitySidebar';
import { BaseEntitySummary } from './components/BaseEntitySummary/BaseEntitySummary';
import { ScreensNameInput } from '../components/ScreensNameInput/ScreensNameInput';
import { ScreensTextEditorLayout } from '../components/ScreensTextEditorLayout/ScreensTextEditorLayout';

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
      header={
        <ScreensNameInput
          placeholder={`${label} Name`}
          initValue={baseEntity.name ?? ''}
          onCommit={(name) => {
            updateBaseEntity({ name });
          }}
        />
      }
      sideBar={<BaseEntitySidebar entityType={entityType} />}
      bodyHeader={<BaseEntitySummary entityType={entityType} />}
      body={
        <TextEditor
          value={baseEntity.description ?? ''}
          textEditorId={`${entityType}_${baseEntity.id}_description`}
          onChange={(description) => {
            updateBaseEntity({ description });
          }}
        />
      }
    />
  );
};
