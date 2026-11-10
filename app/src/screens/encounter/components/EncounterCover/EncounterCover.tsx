import { useParams } from '@tanstack/react-router';
import { UploadImgBtn } from '@/components/UploadImgBtn';
import { useEncounter } from '@/data-access-layer';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '../../../screens.constants';
import './EncounterCover.css';

export const EncounterCover = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter, removeEncounterImage } = useEncounter(
    encounterId,
    adventureId,
  );

  if (!encounter) return;

  const dimensions = { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT };

  const onUpload = (filePath: string) => {
    updateEncounter({
      imgFilePath: filePath,
      image_id: encounter.image_id,
    });
  };

  const onImageDelete = () => {
    if (encounter.image_id) void removeEncounterImage();
  };

  return (
    <div className='encounter-cover'>
      <UploadImgBtn
        dimensions={dimensions}
        image_id={encounter.image_id}
        title=''
        uploadFn={onUpload}
        deleteFn={onImageDelete}
      />
    </div>
  );
};
