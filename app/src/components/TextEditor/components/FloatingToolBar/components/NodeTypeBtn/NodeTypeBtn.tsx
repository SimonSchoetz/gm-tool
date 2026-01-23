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

import './NodeTypeBtn.css';
import { useCallback, useEffect, useState } from 'react';
import { mergeRegister } from '@lexical/utils';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { BaseBtn } from '../BaseBtn/BaseBtn';

type NodeType = 'paragraph' | 'h1' | 'h2' | 'h3';

type NodeTypeBtnProps = {
  label: string;
  nodeType: NodeType;
  icon: LucideIcon;
};

export const NodeTypeBtn: FCProps<NodeTypeBtnProps> = ({
  label,
  nodeType,
  icon,
  ...props
}) => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState<boolean>(false);

  const isCurrentNodeType = useCallback(
    (selection: RangeSelection): boolean => {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      return $isHeadingNode(element) && element.getTag() === nodeType;
    },
    [nodeType],
  );

  const handleStateUpdate = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsActive(isCurrentNodeType(selection));
    }
  }, [isCurrentNodeType]);

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

  const toggleNodeType = (selection: RangeSelection): void => {
    const isCurrentlyTargetType = isCurrentNodeType(selection);

    if (isCurrentlyTargetType) {
      $setBlocksType(selection, () => $createParagraphNode());
    } else if (nodeType === 'paragraph') {
      $setBlocksType(selection, () => $createParagraphNode());
    } else {
      $setBlocksType(selection, () =>
        $createHeadingNode(nodeType as HeadingTagType),
      );
    }
  };
  const handleNodeTypeChange = () => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        toggleNodeType(selection);
      }
    });
  };

  return (
    <BaseBtn
      label={label}
      icon={icon}
      isActive={isActive}
      onClick={handleNodeTypeChange}
      {...props}
    />
  );
};
