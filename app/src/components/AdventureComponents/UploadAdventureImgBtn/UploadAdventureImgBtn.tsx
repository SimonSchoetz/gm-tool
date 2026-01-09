import { filePicker } from '@/util';
import { useState } from 'react';

import { NewAdventureBtn } from '../NewAdventureBtn/NewAdventureBtn';
import { ImageById } from '@/components';
import { useAdventures } from '@/data/adventures';

export const UploadAdventureImgBtn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const { adventure, handleAdventureUpdate } = useAdventures();
  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await filePicker('image');
      if (filePath === null) {
        return;
      } else {
        handleAdventureUpdate({
          image_id: adventure?.image_id,
          imgFilePath: filePath,
        });
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
        {adventure?.image_id ? (
          <ImageById imageId={adventure?.image_id} />
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
