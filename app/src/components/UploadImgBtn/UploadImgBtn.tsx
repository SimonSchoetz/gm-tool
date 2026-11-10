import { FCProps } from '@/types/fcProps.type';
import { pickImageFile } from '@/util/pickImageFile';
import { useState } from 'react';
import { ActionContainer } from '../ActionContainer/ActionContainer';
import { HoloImg } from '../HoloImg';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { ImageViewerDialog } from '../ImageViewerDialog';
import './UploadImgBtn.css';
import { LoadingIcon } from '../LoadingIcon/LoadingIcon';

type Props = {
  image_id?: string | null;
  title?: string;
  dimensions: { width: number; height: number };
  uploadFn: (filePath: string) => void;
  deleteFn: () => void;
};

export const UploadImgBtn: FCProps<Props> = ({
  image_id,
  title = '',
  dimensions,
  uploadFn,
  deleteFn,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupState, setPopupState] = useState<'open' | 'closed'>('closed');

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await pickImageFile();
      if (filePath === null) {
        return;
      } else {
        uploadFn(filePath);
      }
    } catch (err) {
      setError(err?.toString() ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  const onViewImage = () => {
    setPopupState('open');
  };

  const onUploadClick = () => {
    void handleClick();
  };

  const editing = { uploadFn, deleteFn, dimensions };

  return image_id ? (
    <>
      <ActionContainer onClick={onViewImage} label='View image'>
        <HoloImg image_id={image_id} title={title} dimensions={dimensions} />
      </ActionContainer>
      <ImageViewerDialog
        image_id={image_id}
        title={title}
        state={popupState}
        setState={setPopupState}
        editing={editing}
      />
    </>
  ) : (
    <ActionContainer
      className='upload-adventure-img-btn'
      onClick={onUploadClick}
      label='Upload cover image'
    >
      <ImagePlaceholderFrame dimensions={dimensions}>
        <p
          className='img-upload-textbox'
          style={{
            textAlign: 'center',
          }}
        >
          {isLoading ? <LoadingIcon /> : 'Click to upload cover image'}
          {error && <p className='img-upload-error-msg'>{error}</p>}
        </p>
      </ImagePlaceholderFrame>
    </ActionContainer>
  );
};
