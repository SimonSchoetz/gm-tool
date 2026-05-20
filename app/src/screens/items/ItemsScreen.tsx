import { useParams, useRouter } from '@tanstack/react-router';
import { useItems, useTableConfigs } from '@/data-access-layer';
import { SortableList } from '@/components';
import type { Item } from '@db/item';
import { tableConfigNotFoundError } from '@domain/table-config';
import './ItemsScreen.css';

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
    void router.navigate({ to: `/adventure/${adventureId}/item/${newItemId}` });
  };

  if (itemsLoading || configsLoading) {
    return <div className='content-center'>Loading...</div>;
  }

  if (!itemsTableConfig) {
    throw tableConfigNotFoundError('items');
  }

  return (
    <SortableList<Item>
      tableConfigId={itemsTableConfig.id}
      items={items}
      onRowClick={(item) => {
        void router.navigate({ to: `/adventure/${adventureId}/item/${item.id}` });
      }}
      onCreateNew={() => {
        void handleItemCreation();
      }}
      searchPlaceholder='e.g. "name, type, some text in description"'
    />
  );
};
