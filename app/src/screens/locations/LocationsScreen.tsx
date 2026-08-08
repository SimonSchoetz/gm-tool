import { useParams, useRouter } from '@tanstack/react-router';
import { useLocations, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon, SortableList } from '@/components';
import type { Location } from '@db/location';
import { buildEntityPath } from '@domain';
import { tableConfigNotFoundError } from '@domain/table-config';

export const LocationsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/locations',
  });

  const {
    locations,
    loading: locationsLoading,
    createLocation,
  } = useLocations(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const locationsTableConfig = tableConfigs.find(
    (c) => c.table_name === 'locations',
  );

  const handleLocationCreation = async () => {
    const newLocationId = await createLocation();
    void router.navigate({
      to: buildEntityPath('locations', newLocationId, adventureId),
    });
  };

  if (locationsLoading || configsLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  if (!locationsTableConfig) {
    throw tableConfigNotFoundError('locations');
  }

  return (
    <SortableList<Location>
      tableConfigId={locationsTableConfig.id}
      items={locations}
      onRowClick={(location) => {
        void router.navigate({
          to: buildEntityPath('locations', location.id, adventureId),
        });
      }}
      onCreateNew={() => {
        void handleLocationCreation();
      }}
      searchPlaceholder='e.g. "name, region, some text in description"'
    />
  );
};
