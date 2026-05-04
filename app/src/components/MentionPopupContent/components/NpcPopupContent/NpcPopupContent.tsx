import { FCProps } from '@/types';
import { useNpc } from '@/data-access-layer';
import { ImageById } from '../../../ImageById/ImageById';
import { TextEditor } from '../../../TextEditor/TextEditor';
import './NpcPopupContent.css';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const NpcPopupContent: FCProps<Props> = ({ entityId, adventureId }) => {
  const { npc, loading } = useNpc(entityId, adventureId ?? '');

  if (loading) return <div className='npc-popup-loading' />;
  if (!npc) return null;

  return (
    <div className='npc-popup-content'>
      <ImageById imageId={npc.image_id ?? null} className='npc-popup-image' />
      <TextEditor
        value={npc.description ?? ''}
        textEditorId={`npc-popup-${entityId}`}
        readOnly
      />
    </div>
  );
};
