import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { useTiltFX } from '../useTiltFX';

const CONTAINER_WIDTH = 200;
const CONTAINER_HEIGHT = 100;

const createContainer = () => {
  const container = document.createElement('div');
  container.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: CONTAINER_WIDTH,
      height: CONTAINER_HEIGHT,
    }) as DOMRect;
  return container;
};

const renderTilt = (container: HTMLElement | null = createContainer()) =>
  renderHook(() => useTiltFX({ current: container }));

const moveMouse = (
  container: HTMLElement,
  clientX: number,
  clientY: number,
) => {
  act(() => {
    container.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));
  });
};

describe('useTiltFX', () => {
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });

  beforeEach(() => {
    requestFrame.mockClear();
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts inactive and centered', () => {
    const { result } = renderTilt();

    expect(result.current).toMatchObject({
      isActive: false,
      cursorXPercent: 50,
      cursorYPercent: 50,
      rotationX: 0,
      rotationY: 0,
    });
  });

  it('reports no rotation or distance with the cursor at the center', () => {
    const container = createContainer();
    const { result } = renderTilt(container);

    moveMouse(container, CONTAINER_WIDTH / 2, CONTAINER_HEIGHT / 2);

    expect(result.current).toMatchObject({
      isActive: true,
      cursorXPercent: 50,
      cursorYPercent: 50,
      distanceFromCenter: 0,
    });
    expect(result.current.rotationX).toBeCloseTo(0);
    expect(result.current.rotationY).toBeCloseTo(0);
  });

  it('tilts toward the cursor and caps the distance at the far corner', () => {
    const container = createContainer();
    const { result } = renderTilt(container);

    moveMouse(container, CONTAINER_WIDTH, 0);

    expect(result.current).toMatchObject({
      cursorXPercent: 100,
      cursorYPercent: 0,
      rotationX: 2,
      rotationY: 2,
      distanceFromCenter: 1,
      distanceFromCenterX: 1,
      distanceFromCenterY: 1,
    });
  });

  it("reports the container's aspect ratio against its shorter side", () => {
    const container = createContainer();
    const { result } = renderTilt(container);

    moveMouse(container, 10, 10);

    expect(result.current.ratioX).toBe(CONTAINER_WIDTH / CONTAINER_HEIGHT);
    expect(result.current.ratioY).toBe(1);
  });

  it('returns to the inactive centered state when the mouse leaves', () => {
    const container = createContainer();
    const { result } = renderTilt(container);
    moveMouse(container, CONTAINER_WIDTH, 0);

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave'));
    });

    expect(result.current).toMatchObject({
      isActive: false,
      cursorXPercent: 50,
      rotationX: 0,
      ratioX: 1,
    });
  });

  it('stops tracking the mouse once unmounted', () => {
    const container = createContainer();
    const { unmount } = renderTilt(container);
    unmount();

    moveMouse(container, 10, 10);

    expect(requestFrame).not.toHaveBeenCalled();
  });

  it('does nothing without a container element', () => {
    const { result } = renderTilt(null);

    expect(result.current.isActive).toBe(false);
  });
});

describe('useTiltFX with frames that run later', () => {
  const frames = new Map<number, FrameRequestCallback>();
  const cancelFrame = vi.fn((id: number) => {
    frames.delete(id);
  });
  let nextId = 1;

  const runFrames = () => {
    act(() => {
      for (const [id, callback] of [...frames]) {
        frames.delete(id);
        callback(0);
      }
    });
  };

  beforeEach(() => {
    frames.clear();
    nextId = 1;
    cancelFrame.mockClear();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('measures the cursor from the container corner and reports the distance from the center as a fraction of half the container', () => {
    const container = document.createElement('div');
    container.getBoundingClientRect = () =>
      ({ left: 30, top: 20, width: 200, height: 100 }) as DOMRect;
    const { result } = renderTilt(container);

    act(() => {
      container.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 180, clientY: 70 }),
      );
    });
    runFrames();

    expect(result.current.cursorXPercent).toBe(75);
    expect(result.current.cursorYPercent).toBe(50);
    expect(result.current.distanceFromCenter).toBeCloseTo(0.5);
    expect(result.current.distanceFromCenterX).toBeCloseTo(0.5);
    expect(result.current.distanceFromCenterY).toBeCloseTo(0);
  });

  it('drops the frame of an earlier move when a later move arrives', () => {
    const container = createContainer();
    renderTilt(container);

    moveMouse(container, 10, 10);
    const [firstFrame] = [...frames.keys()];
    moveMouse(container, 20, 20);

    expect(cancelFrame).toHaveBeenCalledWith(firstFrame);
    expect(frames.has(firstFrame)).toBe(false);
  });

  it('drops the pending frame when the mouse leaves, so the state stays reset', () => {
    const container = createContainer();
    const { result } = renderTilt(container);
    moveMouse(container, 10, 10);

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave'));
    });
    runFrames();

    expect(cancelFrame).toHaveBeenCalledTimes(1);
    expect(result.current.isActive).toBe(false);
  });

  it('drops the pending frame and both listeners when unmounted', () => {
    const container = createContainer();
    const removeListener = vi.spyOn(container, 'removeEventListener');
    const { unmount } = renderTilt(container);
    moveMouse(container, 10, 10);
    const [pendingFrame] = [...frames.keys()];

    unmount();

    expect(cancelFrame).toHaveBeenCalledWith(pendingFrame);
    expect(removeListener.mock.calls.map(([type]) => type).sort()).toEqual([
      'mouseleave',
      'mousemove',
    ]);
  });

  it('cancels no frame when the mouse leaves or the hook is removed while none is pending', () => {
    const container = createContainer();
    const { unmount } = renderTilt(container);

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave'));
    });
    unmount();

    expect(cancelFrame).not.toHaveBeenCalled();
  });
});
