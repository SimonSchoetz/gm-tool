import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  mergeRegister,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { LinkIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BaseBtn } from '../BaseBtn/BaseBtn';
import './LinkBtn.css';

type Props = {
  onRequestLinkInput: () => void;
};

export const LinkBtn: FCProps<Props> = ({ onRequestLinkInput }) => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState(false);

  const handleStateUpdate = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes();
      const hasLink = nodes.some((node) => {
        const parent = node.getParent();
        return $isLinkNode(node) || $isLinkNode(parent);
      });
      setIsActive(hasLink);
    }
  }, []);

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

  const handleClick = () => {
    if (isActive) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      onRequestLinkInput();
    }
  };

  return <BaseBtn label='Link' icon={LinkIcon} isActive={isActive} onClick={handleClick} />;
};
