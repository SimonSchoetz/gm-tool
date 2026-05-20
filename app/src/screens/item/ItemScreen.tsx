import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { useItem } from '@/data-access-layer';
import './ItemScreen.css';
import { useParams } from '@tanstack/react-router';
import { ItemHeader, ItemSidebar } from './components';

export const ItemScreen = () => {
  const { adventureId, itemId } = useParams({
    from: '/adventure/$adventureId/item/$itemId',
  });

  const { item, updateItem, loading } = useItem(itemId, adventureId);

  if (loading || !item) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className='item-screen'>
      <ItemSidebar />

      <CustomScrollArea>
        <div className='item-text-edit-area'>
          <ItemHeader />

          <TextEditor
            value={item.description ?? ''}
            textEditorId={`ITEM_${item.id}_description`}
            onChange={(description) => {
              updateItem({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
