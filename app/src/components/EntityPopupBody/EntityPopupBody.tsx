import { useState, type ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { ActionContainer } from '../ActionContainer/ActionContainer';
import { ImageById } from '../ImageById/ImageById';
import ImagePlaceholderFrame from '../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { ImageViewerDialog } from '../ImageViewerDialog';
import { PanelBody } from '../PanelBody/PanelBody';
import './EntityPopupBody.css';

type Props = {
  imageId: string | null;
  imageTitle: string | null;
  onImageOpen?: () => void;
  children?: ReactNode;
};

export const EntityPopupBody: FCProps<Props> = ({
  imageId,
  imageTitle,
  onImageOpen,
  children,
}) => {
  const [viewerState, setViewerState] = useState<'open' | 'closed'>('closed');

  const onViewImage = () => {
    onImageOpen?.();
    setViewerState('open');
  };

  const imageDimensions = {
    width: 'var(--popup-content-section-height)',
    height: 'var(--popup-content-section-height)',
  };

  return (
    <PanelBody className='entity-popup-body'>
      {imageId !== null && (
        <>
          <ActionContainer
            label='View image'
            className='entity-popup-body--image-btn'
            onClick={onViewImage}
          >
            <ImagePlaceholderFrame
              className='entity-popup-body--image'
              dimensions={imageDimensions}
            >
              <ImageById imageId={imageId} />
            </ImagePlaceholderFrame>
          </ActionContainer>
          <ImageViewerDialog
            image_id={imageId}
            title={imageTitle ?? ''}
            state={viewerState}
            setState={setViewerState}
          />
        </>
      )}
      {children}
    </PanelBody>
  );
};
