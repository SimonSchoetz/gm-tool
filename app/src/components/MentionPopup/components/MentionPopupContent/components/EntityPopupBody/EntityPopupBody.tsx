import { FCProps } from '@/types';
import { ImageById } from '../../../../../ImageById/ImageById';
import { TextEditor } from '../../../../../TextEditor/TextEditor';
import { CustomScrollArea } from '../../../../../CustomScrollArea/CustomScrollArea';
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
      <ImageById
        imageId={imageId}
        className='entity-popup-image avatar-dimensions'
      />
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
