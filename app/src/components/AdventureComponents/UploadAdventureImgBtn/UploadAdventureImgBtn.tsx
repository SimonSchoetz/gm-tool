import { cn, filePicker } from '@/util';
import { useState } from 'react';
import { ActionContainer, HoloImg } from '@/components';
import { useAdventures } from '@/data/adventures';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import './UploadAdventureImgBtn.css';

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
    <div>
      {adventure?.image_id ? (
        <ActionContainer onClick={handleClick} label='Replace cover image'>
          <HoloImg image_id={adventure.image_id} title={''} />
        </ActionContainer>
      ) : (
        <ActionContainer onClick={handleClick} label='Upload cover image'>
          <AdventureFrame className={cn('upload-adventure-img-btn')}>
            <p
              style={{
                textAlign: 'center',
              }}
            >
              {isLoading ? 'Loading...' : 'Click to upload cover image'}
            </p>
          </AdventureFrame>
        </ActionContainer>
      )}
      {error && error}
    </div>
  );
};
