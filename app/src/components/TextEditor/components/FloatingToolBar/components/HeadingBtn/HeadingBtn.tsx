import { FCProps } from '@/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  RangeSelection,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { LucideIcon } from 'lucide-react';

import './HeadingBtn.css';
import { useCallback, useEffect, useState } from 'react';
import { mergeRegister } from '@lexical/utils';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { BaseBtn } from '../BaseBtn/BaseBtn';

/**
 * Might need revision regarding 'paragraph' when implementing node type of list
 */
type HeadingType = 'paragraph' | 'h1' | 'h2' | 'h3';

type HeadingBtnProps = {
  label: string;
  headingType: HeadingType;
  icon: LucideIcon;
};

export const HeadingBtn: FCProps<HeadingBtnProps> = ({
  label,
  headingType,
  icon,
  ...props
}) => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState<boolean>(false);

  const isCurrentHeadingType = useCallback(
    (selection: RangeSelection): boolean => {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      return $isHeadingNode(element) && element.getTag() === headingType;
    },
    [headingType],
  );

  const handleStateUpdate = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsActive(isCurrentHeadingType(selection));
    }
  }, [isCurrentHeadingType]);

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

  const toggleHeadingType = (selection: RangeSelection): void => {
    const isCurrentlyTargetType = isCurrentHeadingType(selection);

    if (isCurrentlyTargetType) {
      $setBlocksType(selection, () => $createParagraphNode());
    } else if (headingType === 'paragraph') {
      $setBlocksType(selection, () => $createParagraphNode());
    } else {
      $setBlocksType(selection, () =>
        $createHeadingNode(headingType as HeadingTagType),
      );
    }
  };
  const handleHeadingTypeChange = () => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        toggleHeadingType(selection);
      }
    });
  };

  return (
    <BaseBtn
      label={label}
      icon={icon}
      isActive={isActive}
      onClick={handleHeadingTypeChange}
      {...props}
    />
  );
};
