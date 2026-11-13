import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDragImageOfRow } from '../setDragImageOfRow';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const dataTransferRecording = (element: HTMLElement) => {
  const calls: {
    image: HTMLElement;
    x: number;
    y: number;
    transform: string;
  }[] = [];
  return {
    calls,
    dataTransfer: {
      setDragImage: (image: Element, x: number, y: number) => {
        calls.push({
          image: image as HTMLElement,
          x,
          y,
          transform: element.style.transform,
        });
      },
    },
  };
};

describe('setDragImageOfRow', () => {
  it('sets the element as the drag image while it is on its own compositing layer', () => {
    const element = document.createElement('div');
    const { calls, dataTransfer } = dataTransferRecording(element);

    setDragImageOfRow(dataTransfer, element);

    expect(calls).toEqual([
      { image: element, x: 0, y: 0, transform: 'translateZ(0)' },
    ]);
  });

  it('puts the element’s own transform back once the capture is done, and leaves none where it had none', () => {
    const withTransform = document.createElement('div');
    withTransform.style.transform = 'rotate(2deg)';
    const withoutTransform = document.createElement('div');

    setDragImageOfRow(
      dataTransferRecording(withTransform).dataTransfer,
      withTransform,
    );
    setDragImageOfRow(
      dataTransferRecording(withoutTransform).dataTransfer,
      withoutTransform,
    );
    expect(withTransform.style.transform).toBe('translateZ(0)');

    vi.runOnlyPendingTimers();

    expect(withTransform.style.transform).toBe('rotate(2deg)');
    expect(withoutTransform.style.transform).toBe('');
  });
});
