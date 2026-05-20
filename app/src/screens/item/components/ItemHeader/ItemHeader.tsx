import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { useItem } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './ItemHeader.css';

export const ItemHeader = () => {
  const { adventureId, itemId } = useParams({
    from: '/adventure/$adventureId/item/$itemId',
  });

  const { item, updateItem } = useItem(itemId, adventureId);

  const [itemName, setItemName] = useState(item?.name ?? '');

  if (!item) return null;

  return (
    <GlassPanel className='item-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={itemName}
        onChange={(e) => {
          setItemName(e.target.value);
          updateItem({ name: e.target.value });
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
