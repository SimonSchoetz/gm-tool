import { FCProps } from '@/types/fcProps.type';
import { TextEditor } from '../../../../../TextEditor';
import './EntityPopupBodyText.css';

type Props = {
  text: string | null;
  textEditorId: string;
};

export const EntityPopupBodyText: FCProps<Props> = ({ text, textEditorId }) => {
  if (text === null) return null;

  return (
    <div className='entity-popup-body-text'>
      <TextEditor value={text} textEditorId={textEditorId} readOnly />
    </div>
  );
};
