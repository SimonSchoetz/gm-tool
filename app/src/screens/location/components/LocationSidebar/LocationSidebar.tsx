import { UploadImgBtn, Button } from '@/components';
import { useLocation } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
import { useRouter, useParams } from '@tanstack/react-router';
import './LocationSidebar.css';

export const LocationSidebar = () => {
  const router = useRouter();
  const { adventureId, locationId } = useParams({
    from: '/adventure/$adventureId/location/$locationId',
  });
  const { location, updateLocation, deleteLocation, removeLocationImage } =
    useLocation(locationId, adventureId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!location) return null;

  const handleLocationDelete = async () => {
    await deleteLocation();
    void router.navigate({ to: `/adventure/${adventureId}/locations` });
  };

  return (
    <aside className='location-sidebar'>
      <UploadImgBtn
        dimensions={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
        image_id={location.image_id ?? null}
        title=''
        uploadFn={(filePath) => {
          updateLocation({
            imgFilePath: filePath,
            image_id: location.image_id,
          });
        }}
        deleteFn={() => {
          if (location.image_id) void removeLocationImage();
        }}
      />

      <Button
        label='Delete Location'
        onClick={() => {
          openDeleteDialog({
            name: location.name ?? '',
            onDeletionConfirm: () => {
              void handleLocationDelete();
            },
            oneClickConfirm: false,
          });
        }}
        buttonStyle={'danger'}
      />
    </aside>
  );
};
