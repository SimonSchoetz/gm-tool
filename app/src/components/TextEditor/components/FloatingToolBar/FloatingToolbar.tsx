import ActionContainer from '@/components/ActionContainer/ActionContainer';
import { FCProps } from '@/types';
import { BoldIcon, ItalicIcon } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';

type Props = object;

export const FloatingToolbar: FCProps<Props> = ({ ...props }) => {
  const [editor] = useLexicalComposerContext();
  const handleClick = (formatType: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };
  return (
    <div {...props}>
      <ActionContainer label='Bold' onClick={() => handleClick('bold')}>
        <BoldIcon />
      </ActionContainer>
      <ActionContainer label='Italic' onClick={() => handleClick('italic')}>
        <ItalicIcon />
      </ActionContainer>
    </div>
  );
};
