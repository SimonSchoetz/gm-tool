import { UploadImgBtn, Button } from '@/components';
import { useItem } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './ItemSidebar.css';

export const ItemSidebar = () => {
  const router = useRouter();
  const { adventureId, itemId } = useParams({
    from: '/adventure/$adventureId/item/$itemId',
  });
  const { item, updateItem, deleteItem, removeItemImage } = useItem(
    itemId,
    adventureId,
  );
  const { openDeleteDialog } = useDeleteDialog();

  if (!item) return null;

  const handleItemDelete = async () => {
    await deleteItem();
    void router.navigate({ to: `/adventure/${adventureId}/items` });
  };

  return (
    <aside className='item-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={item.image_id ?? null}
        title={item.name ?? ''}
        uploadFn={(filePath) => {
          updateItem({ imgFilePath: filePath, image_id: item.image_id });
        }}
        deleteFn={() => {
          if (item.image_id) void removeItemImage();
        }}
      />

      <Button
        label='Delete Item'
        onClick={() => {
          openDeleteDialog({
            name: item.name ?? '',
            onDeletionConfirm: () => {
              void handleItemDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
