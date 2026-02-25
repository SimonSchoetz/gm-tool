import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, RangeSelection } from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW, mergeRegister } from 'lexical';
import { BaseBtn } from '../BaseBtn/BaseBtn';
import './ListBtn.css';

type ListType = 'bullet' | 'number';

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

  // Check if current selection is in a list of this type
  const isCurrentListType = useCallback(
    (selection: RangeSelection): boolean => {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      // Check if parent is a list node
      if ($isListNode(element)) {
        const listType_tag = (element as ListNode).getListType();
        return (
          (listType === 'bullet' && listType_tag === 'bullet') ||
          (listType === 'number' && listType_tag === 'number')
        );
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
          // Remove list
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        } else {
          // Insert list
          if (listType === 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          }
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
