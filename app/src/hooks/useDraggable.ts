import { useState, useRef } from 'react';
import React from 'react';

type Position = { x: number; y: number };

type DragOrigin = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export const useDraggable = (
  initialPosition: Position,
  onChange?: (position: Position) => void,
): {
  position: Position;
  draggableProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
} => {
  const [position, setPosition] = useState(initialPosition);
  const dragRef = useRef<DragOrigin | null>(null);
  const positionRef = useRef(initialPosition);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newPos = {
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    };
    positionRef.current = newPos;
    setPosition(newPos);
  };

  const onPointerUp = (_e: React.PointerEvent) => {
    if (dragRef.current === null) return;
    dragRef.current = null;
    onChange?.(positionRef.current);
  };

  return {
    position,
    draggableProps: { onPointerDown, onPointerMove, onPointerUp },
  };
};
