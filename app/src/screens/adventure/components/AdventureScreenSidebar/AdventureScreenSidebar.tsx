import { UploadImgBtn } from '@/components/UploadImgBtn';
import { useAdventure } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { ADVENTURE_PREVIEW_DIMENSIONS } from '../../../screens.constants';
import { ScreensSidebar } from '../../../components/ScreensSidebar/ScreensSidebar';

export const AdventureScreenSidebar = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure, removeAdventureImage } =
    useAdventure(adventureId);

  if (!adventure) return;

  const onUpload = (filePath: string) => {
    updateAdventure({
      imgFilePath: filePath,
      image_id: adventure.image_id,
    });
  };

  const onImageDelete = () => {
    if (adventure.image_id) void removeAdventureImage();
  };

  return (
    <ScreensSidebar>
      <UploadImgBtn
        dimensions={ADVENTURE_PREVIEW_DIMENSIONS}
        image_id={adventure.image_id}
        uploadFn={onUpload}
        deleteFn={onImageDelete}
      />
    </ScreensSidebar>
  );
};
