import { LoadingIcon, TextEditor } from '@/components';
import { useItem } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { ItemHeader, ItemSidebar } from './components';
import { ScreensTextEditorLayout } from '../components';

export const ItemScreen = () => {
  const { adventureId, itemId } = useParams({
    from: '/adventure/$adventureId/item/$itemId',
  });

  const { item, updateItem, loading } = useItem(itemId, adventureId);

  if (loading || !item) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      header={<ItemHeader />}
      sideBar={<ItemSidebar />}
      body={
        <TextEditor
          value={item.description ?? ''}
          textEditorId={`ITEM_${item.id}_description`}
          onChange={(description) => {
            updateItem({ description });
          }}
        />
      }
    />
  );
};
