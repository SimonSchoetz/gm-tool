import { filePicker } from '@/util/filePicker';
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

export const UploadImgBtn = ({
  image_id,
  title = '',
  dimensions,
  uploadFn,
  deleteFn,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popupState, setPopupState] = useState<'open' | 'closed'>('closed');

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await filePicker();
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

  return image_id ? (
    <>
      <ActionContainer
        onClick={() => {
          setPopupState('open');
        }}
        label='View image'
      >
        <HoloImg image_id={image_id} title={title} dimensions={dimensions} />
      </ActionContainer>
      <ImageViewerDialog
        image_id={image_id}
        title={title}
        state={popupState}
        setState={setPopupState}
        editing={{ uploadFn, deleteFn, dimensions }}
      />
    </>
  ) : (
    <ActionContainer
      className='upload-adventure-img-btn'
      onClick={() => {
        void handleClick();
      }}
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
