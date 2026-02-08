import { cn, filePicker } from '@/util';
import { useState } from 'react';
import { ActionContainer, HoloImg } from '@/components';
import AdventureFrame from '../AdventureFrame/AdventureFrame';
import './UploadAdventureImgBtn.css';

type Props = {
  image_id?: string;
  title?: string;
  uploadFn: (filePath: string) => void;
};

export const UploadAdventureImgBtn = ({
  image_id,
  title = '',
  uploadFn,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await filePicker('image');
      if (filePath === null) {
        return;
      } else {
        uploadFn(filePath);
      }
    } catch (err) {
      setError(err?.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {image_id ? (
        <ActionContainer
          className={cn('replace-adventure-img-btn')}
          onClick={handleClick}
          label='Replace cover image'
          invisible
        >
          <HoloImg image_id={image_id} title={title} />
        </ActionContainer>
      ) : (
        <ActionContainer
          className={cn('upload-adventure-img-btn')}
          onClick={handleClick}
          label='Upload cover image'
        >
          <AdventureFrame>
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
