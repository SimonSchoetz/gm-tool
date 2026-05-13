import { cn, filePicker } from '@/util';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { ActionContainer, HoloImg } from '@/components';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';
import PopUpContainer from '../PopUpContainer/PopUpContainer';
import { ImageViewerDialog } from './components';
import './UploadImgBtn.css';

type Props = {
  image_id?: string | null;
  title?: string;
  dimensions?: React.ComponentProps<typeof ImagePlaceholderFrame>['dimensions'];
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
      const filePath = await filePicker('image');
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
        onClick={() => { setPopupState('open'); }}
        label='View image'
      >
        <HoloImg image_id={image_id} title={title} dimensions={dimensions} />
      </ActionContainer>
      {createPortal(
        <PopUpContainer state={popupState} setState={setPopupState}>
          <ImageViewerDialog
            image_id={image_id}
            title={title}
            onClose={() => { setPopupState('closed'); }}
            uploadFn={uploadFn}
            deleteFn={deleteFn}
            {...(dimensions !== undefined ? { dimensions } : {})}
          />
        </PopUpContainer>,
        document.body,
      )}
    </>
  ) : (
    <ActionContainer
      className={cn('upload-adventure-img-btn')}
      onClick={() => {
        void handleClick();
      }}
      label='Upload cover image'
    >
      <ImagePlaceholderFrame
        {...(dimensions !== undefined ? { dimensions } : {})}
      >
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
  );
};
