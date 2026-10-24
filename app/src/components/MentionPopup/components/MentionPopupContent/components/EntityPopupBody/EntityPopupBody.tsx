import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { ImageById } from '../../../../../ImageById/ImageById';
import ImagePlaceholderFrame from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { PanelBody } from '../../../../../PanelBody/PanelBody';
import './EntityPopupBody.css';

type Props = {
  imageId: string | null;
  children?: ReactNode;
};

export const EntityPopupBody: FCProps<Props> = ({ imageId, children }) => (
  <PanelBody className='entity-popup-body'>
    {imageId !== null && (
      <ImagePlaceholderFrame
        className='entity-popup-body--image'
        dimensions={{
          width: 'var(--popup-content-section-height)',
          height: 'var(--popup-content-section-height)',
        }}
      >
        <ImageById imageId={imageId} />
      </ImagePlaceholderFrame>
    )}
    {children}
  </PanelBody>
);
