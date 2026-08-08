import { useParams, useRouter } from '@tanstack/react-router';
import { useItems, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon, SortableList } from '@/components';
import type { Item } from '@db/item';
import { buildEntityPath } from '@domain';
import { tableConfigNotFoundError } from '@domain/table-config';

export const ItemsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/items',
  });

  const { items, loading: itemsLoading, createItem } = useItems(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const itemsTableConfig = tableConfigs.find((c) => c.table_name === 'items');

  const handleItemCreation = async () => {
    const newItemId = await createItem();
    void router.navigate({
      to: buildEntityPath('items', newItemId, adventureId),
    });
  };

  if (itemsLoading || configsLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  if (!itemsTableConfig) {
    throw tableConfigNotFoundError('items');
  }

  return (
    <SortableList<Item>
      tableConfigId={itemsTableConfig.id}
      items={items}
      onRowClick={(item) => {
        void router.navigate({
          to: buildEntityPath('items', item.id, adventureId),
        });
      }}
      onCreateNew={() => {
        void handleItemCreation();
      }}
      searchPlaceholder='e.g. "name, type, some text in description"'
    />
  );
};
