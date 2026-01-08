import { filePicker } from '@/util';
import { useEffect, useState } from 'react';
import { FCProps } from '@/types';
import { NewAdventureBtn } from '../NewAdventureBtn/NewAdventureBtn';
import { ImageById } from '@/components';
import { useAdventures } from '@/data/adventures';

export const UploadAdventureImgBtn: FCProps<{
  adventureId: string;
}> = ({ adventureId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [filePath, setFilePath] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string>();

  const { getAdventure, updateAdventure } = useAdventures();

  useEffect(() => {
    const getFromDb = async () => {
      const adv = await getAdventure(adventureId);
      setImageId(adv.image_id || '');
    };
    getFromDb();
  }, []);

  useEffect(() => {
    /**
     * when filepath changes
     * -> upload image
     * -> check for replace functionality -> must replace id in adventure and delete the old image to reduce waste
     * -> update and refresh adventure
     * -> setImageId
     */
  }, [filePath]);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await filePicker('image');
      if (filePath === null) {
        return;
      } else {
        setFilePath(filePath);
      }
    } catch (err) {
      setError(err?.toString());
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <NewAdventureBtn onClick={handleClick} label='Upload cover image'>
        {imageId ? (
          <ImageById imageId={imageId} />
        ) : (
          <p
            style={{
              textAlign: 'center',
            }}
          >
            {isLoading
              ? 'Loading...'
              : 'Click to upload cover image or drag&drop'}
          </p>
        )}
      </NewAdventureBtn>
      {error && error}
    </>
  );
};
