import { LoadingIcon, TextEditor } from '@/components';
import { useItem } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { ItemSidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

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
      sideBar={<ItemSidebar />}
      header={
        <ScreensSummary>
          <TextEditor
            placeholder='Item Summary'
            value={item.summary ?? ''}
            textEditorId={`ITEM_${item.id}_summary`}
            onChange={(summary) => {
              updateItem({ summary });
            }}
          />
        </ScreensSummary>
      }
      body={
        <>
          <ScreensNameInput
            placeholder='Item Name'
            initValue={item.name ?? ''}
            onCommit={(name) => {
              updateItem({ name });
            }}
          />
          <TextEditor
            value={item.description ?? ''}
            textEditorId={`ITEM_${item.id}_description`}
            onChange={(description) => {
              updateItem({ description });
            }}
          />
        </>
      }
    />
  );
};
