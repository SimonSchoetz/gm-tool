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
