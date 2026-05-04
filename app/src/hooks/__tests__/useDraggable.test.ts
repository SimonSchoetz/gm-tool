import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { useDraggable } from '../useDraggable';

const makePointerEvent = (
  clientX: number,
  clientY: number,
  currentTarget?: Partial<Element>,
): React.PointerEvent =>
  ({
    clientX,
    clientY,
    pointerId: 1,
    currentTarget: {
      setPointerCapture: vi.fn(),
      ...currentTarget,
    } as unknown as Element,
  }) as unknown as React.PointerEvent;

describe('useDraggable', () => {
  it('returns initial position as-is', () => {
    const { result } = renderHook(() => useDraggable({ x: 10, y: 20 }));
    expect(result.current.position).toEqual({ x: 10, y: 20 });
  });

  it('updates position during drag', () => {
    const { result } = renderHook(() => useDraggable({ x: 0, y: 0 }));
    act(() => {
      result.current.draggableProps.onPointerDown(makePointerEvent(100, 200));
    });
    act(() => {
      result.current.draggableProps.onPointerMove(makePointerEvent(130, 250));
    });
    expect(result.current.position).toEqual({ x: 30, y: 50 });
  });

  it('calls onChange with final position on pointer-up', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDraggable({ x: 0, y: 0 }, onChange));
    act(() => {
      result.current.draggableProps.onPointerDown(makePointerEvent(0, 0));
    });
    act(() => {
      result.current.draggableProps.onPointerMove(makePointerEvent(40, 60));
    });
    act(() => {
      result.current.draggableProps.onPointerUp(makePointerEvent(40, 60));
    });
    expect(onChange).toHaveBeenCalledWith({ x: 40, y: 60 });
  });

  it('does not update position when pointermove fires without prior pointerdown', () => {
    const { result } = renderHook(() => useDraggable({ x: 5, y: 5 }));
    act(() => {
      result.current.draggableProps.onPointerMove(makePointerEvent(100, 100));
    });
    expect(result.current.position).toEqual({ x: 5, y: 5 });
  });

  it('does not call onChange when pointer-up fires without active drag', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDraggable({ x: 0, y: 0 }, onChange));
    act(() => {
      result.current.draggableProps.onPointerUp(makePointerEvent(50, 50));
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
