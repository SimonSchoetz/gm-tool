import { useRef, useState } from 'react';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { BlockDragHandle, BlockDropIndicator } from './components';
import { getTargetCalculateHeight, isOnMenu } from './helper';

type Props = {
  anchorElem: HTMLElement;
};

export const BlockDragHandlePlugin = ({ anchorElem }: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const barHeight = hoveredElement?.getBoundingClientRect().height ?? null;
  const anchorHeight = hoveredElement
    ? getTargetCalculateHeight(hoveredElement)
    : null;

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <BlockDragHandle
          ref={menuRef}
          barHeight={barHeight}
          anchorHeight={anchorHeight}
        />
      }
      targetLineComponent={<BlockDropIndicator ref={targetLineRef} />}
      isOnMenu={isOnMenu}
      onElementChanged={(element) => {
        setHoveredElement(element);
      }}
    />
  );
};
