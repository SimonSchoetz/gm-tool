import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  FORMAT_TEXT_COMMAND,
  TextFormatType,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  mergeRegister,
} from 'lexical';
import { LucideIcon } from 'lucide-react';
import './TextFormatBtn.css';

import { useCallback, useEffect, useState } from 'react';
import { BaseBtn } from '../BaseBtn/BaseBtn';

type TextFormatBtnProps = {
  label: string;
  formatType: TextFormatType;
  icon: LucideIcon;
};

export const TextFormatBtn: FCProps<TextFormatBtnProps> = ({
  label,
  formatType,
  icon,
  ...props
}) => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState<boolean>(false);

  const handleStateUpdate = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      setIsActive(selection.hasFormat(formatType));
    }
  }, [formatType]);

  useEffect(() => {
    editor.getEditorState().read(handleStateUpdate);

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(handleStateUpdate);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          editor.getEditorState().read(handleStateUpdate);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, handleStateUpdate]);

  const handleFormat = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  return (
    <BaseBtn
      label={label}
      icon={icon}
      isActive={isActive}
      onClick={handleFormat}
      {...props}
    />
  );
};
