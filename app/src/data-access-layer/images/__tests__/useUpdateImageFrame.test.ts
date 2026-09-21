import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as imageService from '@services/imageService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { imageKeys } from '../imageKeys';
import { useUpdateImageFrame } from '../useUpdateImageFrame';

const updateImageFrame = vi.hoisted(() =>
  vi.fn<typeof imageService.updateImageFrame>(),
);

vi.mock('@services/imageService', () => ({ updateImageFrame }));

const FIRST_FRAME = { x: 10, y: 20, zoom: 1.5 };
const SECOND_FRAME = { x: 30, y: 40, zoom: 2 };

const renderUpdateImageFrame = () =>
  renderHookWithQueryClient(
    ({ imageId }: { imageId: string }) => useUpdateImageFrame(imageId),
    { initialProps: { imageId: 'image-1' } },
  );

describe('useUpdateImageFrame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateImageFrame.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled image and its frame after a re-render for another image', async () => {
    const { result, rerender } = renderUpdateImageFrame();

    act(() => {
      result.current.updateFrame(FIRST_FRAME);
    });
    rerender({ imageId: 'image-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateImageFrame).toHaveBeenCalledTimes(1);
    expect(updateImageFrame).toHaveBeenCalledWith('image-1', FIRST_FRAME);
  });

  it('writes only the last frame scheduled within the delay', async () => {
    const { result } = renderUpdateImageFrame();

    act(() => {
      result.current.updateFrame(FIRST_FRAME);
    });
    act(() => {
      result.current.updateFrame(SECOND_FRAME);
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateImageFrame).toHaveBeenCalledTimes(1);
    expect(updateImageFrame).toHaveBeenCalledWith('image-1', SECOND_FRAME);
  });

  it('invalidates the scheduled image after a re-render for another image', async () => {
    const { result, rerender, invalidateQueries } = renderUpdateImageFrame();

    act(() => {
      result.current.updateFrame(FIRST_FRAME);
    });
    rerender({ imageId: 'image-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: imageKeys.detail('image-1'),
    });
  });
});
