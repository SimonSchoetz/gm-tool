import { ActionContainer, GlassPanel } from '@/components';
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
import { cn } from '@/util';
import './NodeTypeBtn.css';
import { useEffect, useState } from 'react';
import { mergeRegister } from '@lexical/utils';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';

type NodeType = 'paragraph' | 'h1' | 'h2' | 'h3';

type NodeTypeBtnProps = {
  label: string;
  nodeType: NodeType;
  icon: LucideIcon;
};

export const NodeTypeBtn: FCProps<NodeTypeBtnProps> = ({
  label,
  nodeType,
  icon: Icon,
  ...props
}) => {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState<boolean>(false);

  const updateActiveState = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const active = isCurrentNodeType(selection);
        setIsActive(active);
      }
    });
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const active = isCurrentNodeType(selection);
            setIsActive(active);
          }
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateActiveState();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, nodeType]);

  const isCurrentNodeType = (selection: RangeSelection): boolean => {
    // Check the actual current node type at click time
    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

    return $isHeadingNode(element) && element.getTag() === nodeType;
  };

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
    <GlassPanel
      data-active={isActive}
      radius='md'
      intensity={isActive ? 'bright' : 'off'}
      className={cn('button', isActive && 'active')}
    >
      <ActionContainer
        className='node-type-btn'
        label={label}
        onClick={handleNodeTypeChange}
        {...props}
      >
        <Icon size={'var(--font-size-base)'} />
      </ActionContainer>
    </GlassPanel>
  );
};
