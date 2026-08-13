import { FCProps } from '@/types';
import { ImageById } from '../../../../../ImageById/ImageById';
import { TextEditor } from '../../../../../TextEditor/TextEditor';
import ImagePlaceholderFrame from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { PREVIEW_WIDTH } from '@/screens/screens.constants';
import './EntityPopupBody.css';

type Props = {
  summary: string | null;
  imageId: string | null;
  textEditorId: string;
};

export const EntityPopupBody: FCProps<Props> = ({
  summary,
  imageId,
  textEditorId,
}) => (
  <div className='entity-popup-body'>
    {imageId !== null && (
      <ImagePlaceholderFrame
        className='entity-popup-image'
        dimensions={{
          width: PREVIEW_WIDTH / 2,
          height: 'auto',
        }}
      >
        <ImageById imageId={imageId} />
      </ImagePlaceholderFrame>
    )}
    {summary !== null && (
      <div className='entity-popup-summary'>
        <TextEditor
          value={summary}
          textEditorId={textEditorId}
          placeholder='Nothing here yet...'
          readOnly
        />
      </div>
    )}
  </div>
);
