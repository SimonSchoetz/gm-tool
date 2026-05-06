import { FCProps } from '@/types';
import { ImageById } from '../../../ImageById/ImageById';
import './EntityPopupBody.css';

type Props = {
  summary: string | null;
  imageId: string | null;
};

export const EntityPopupBody: FCProps<Props> = ({ summary, imageId }) => (
  <div className='entity-popup-body'>
    {imageId !== null && (
      <ImageById
        imageId={imageId}
        className='entity-popup-image avatar-dimensions'
      />
    )}
    {summary !== null && <div className='entity-popup-summary'>{summary}</div>}
  </div>
);
