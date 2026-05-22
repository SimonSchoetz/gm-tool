import { FCProps } from '@/types';
import { ImageById } from '../../../../../ImageById/ImageById';
import { TextEditor } from '../../../../../TextEditor/TextEditor';
import { CustomScrollArea } from '../../../../../CustomScrollArea/CustomScrollArea';
import ImagePlaceholderFrame from '../../../../../ImagePlaceholderFrame/ImagePlaceholderFrame';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/screens/screens.constants';
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
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
        }}
      >
        <ImageById imageId={imageId} className='avatar-dimensions' />
      </ImagePlaceholderFrame>
    )}
    {summary !== null && (
      <CustomScrollArea className='entity-popup-summary'>
        <TextEditor
          value={summary}
          textEditorId={textEditorId}
          placeholder='Nothing here yet...'
          readOnly
        />
      </CustomScrollArea>
    )}
  </div>
);
