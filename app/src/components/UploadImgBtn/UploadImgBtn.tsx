import { cn, filePicker } from '@/util';
import { useState } from 'react';
import { ActionContainer, HoloImg } from '@/components';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';
import './UploadImgBtn.css';

type Props = {
  image_id?: string;
  title?: string;
  uploadFn: (filePath: string) => void;
};

export const UploadImgBtn = ({ image_id, title = '', uploadFn }: Props) => {
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

  return image_id ? (
    <ActionContainer
      onClick={handleClick}
      label='Replace cover image'
      invisible
    >
      <HoloImg image_id={image_id} title={title} />
    </ActionContainer>
  ) : (
    <div>
      <ActionContainer
        className={cn('upload-adventure-img-btn')}
        onClick={handleClick}
        label='Upload cover image'
      >
        <ImagePlaceholderFrame>
          <p
            className='img-upload-textbox'
            style={{
              textAlign: 'center',
            }}
          >
            {isLoading ? 'Loading...' : 'Click to upload cover image'}
            {error && <p className='img-upload-error-msg'>{error}</p>}
          </p>
        </ImagePlaceholderFrame>
      </ActionContainer>
    </div>
  );
};
