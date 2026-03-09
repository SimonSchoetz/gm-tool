import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, RangeSelection } from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW, mergeRegister } from 'lexical';
import { BaseBtn } from '../BaseBtn/BaseBtn';
import './ListBtn.css';

type ListType = 'bullet' | 'number' | 'check';

type ListBtnProps = {
  label: string;
  listType: ListType;
  icon: LucideIcon;
};

export const ListBtn: FCProps<ListBtnProps> = ({
  label,
  listType,
  icon,
  ...props
}) => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState<boolean>(false);

  const isCurrentListType = useCallback(
    (selection: RangeSelection): boolean => {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isListNode(element)) {
        return (element as ListNode).getListType() === listType;
      }
      return false;
    },
    [listType],
  );

  const handleStateUpdate = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsActive(isCurrentListType(selection));
    }
  }, [isCurrentListType]);

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

  const handleListToggle = () => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        const isCurrentlyTargetType = isCurrentListType(selection);

        if (isCurrentlyTargetType) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else if (listType === 'bullet') {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else if (listType === 'number') {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        }
      }
    });
  };

  return (
    <BaseBtn
      label={label}
      icon={icon}
      isActive={isActive}
      onClick={handleListToggle}
      {...props}
    />
  );
};
