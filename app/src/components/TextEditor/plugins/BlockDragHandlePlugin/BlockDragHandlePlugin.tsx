import { useRef } from 'react';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { BlockDragHandle, BlockDropIndicator } from './components';
import { isOnMenu } from './helper';

type Props = {
  anchorElem: HTMLElement;
};

export const BlockDragHandlePlugin = ({ anchorElem }: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

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
