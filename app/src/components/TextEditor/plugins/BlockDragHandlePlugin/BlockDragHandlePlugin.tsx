import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { BlockDragHandle, BlockDropIndicator } from './components';
import { isOnMenu } from './helper';

export const BlockDragHandlePlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      editor.registerRootListener((rootElement) => {
        setAnchorElem(rootElement);
      }),
    [editor],
  );

  if (!anchorElem) return null;

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={<BlockDragHandle ref={menuRef} />}
      targetLineComponent={<BlockDropIndicator ref={targetLineRef} />}
      isOnMenu={isOnMenu}
    />
  );
};
