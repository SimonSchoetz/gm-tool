import {
  GlassPanel,
  SyncedInput,
  CustomScrollArea,
  TextEditor,
} from '@/components';
import { useItem } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './ItemHeader.css';

export const ItemHeader = () => {
  const { adventureId, itemId } = useParams({
    from: '/adventure/$adventureId/item/$itemId',
  });

  const { item, updateItem } = useItem(itemId, adventureId);

  if (!item) return null;

  return (
    <GlassPanel className='item-summary' intensity='bright'>
      <SyncedInput
        placeholder='Name'
        initValue={item.name ?? ''}
        onCommit={(name) => {
          updateItem({ name });
        }}
        className='item-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summary'
          value={item.summary ?? ''}
          textEditorId={`ITEM_${item.id}_summary`}
          onChange={(summary) => {
            updateItem({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
