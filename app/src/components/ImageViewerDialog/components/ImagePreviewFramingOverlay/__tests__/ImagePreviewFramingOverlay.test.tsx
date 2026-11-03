import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as service from '@services/imageService';
import {
  imageQueryOptions,
  queryClient,
  TanstackQueryClientProvider,
} from '@/data-access-layer';
import { ImagePreviewFramingOverlay } from '../ImagePreviewFramingOverlay';

const getImageById = vi.hoisted(() => vi.fn<typeof service.getImageById>());
const getImageUrl = vi.hoisted(() => vi.fn<typeof service.getImageUrl>());
const updateImageFrame = vi.hoisted(() =>
  vi.fn<typeof service.updateImageFrame>(),
);

vi.mock('@services/imageService', () => ({
  getImageById,
  getImageUrl,
  updateImageFrame,
}));

const IMAGE_ID = 'image-1';
const STORED_FRAME = { x: 30, y: 40, zoom: 2 };

describe('ImagePreviewFramingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    queryClient.clear();
    getImageById.mockResolvedValue({
      id: IMAGE_ID,
      file_extension: 'png',
      frame_x: STORED_FRAME.x,
      frame_y: STORED_FRAME.y,
      frame_zoom: STORED_FRAME.zoom,
      created_at: '2026-01-10T09:00:00.000Z',
      updated_at: '2026-01-10T09:00:00.000Z',
    });
    getImageUrl.mockResolvedValue('asset://image-1.png');
    updateImageFrame.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('zooms in on a scroll up over the preview instead of scrolling the page, and saves the zoomed frame', async () => {
    // The dialog shows the image before framing starts, so its query is cached when the overlay mounts.
    await queryClient.query(imageQueryOptions(IMAGE_ID));
    render(
      <ImagePreviewFramingOverlay
        imageId={IMAGE_ID}
        dimensions={{ width: 400, height: 300 }}
      />,
      { wrapper: TanstackQueryClientProvider },
    );

    const scrolledPage = fireEvent.wheel(
      screen.getByRole('img', { name: 'Framing preview' }),
      { deltaY: -100 },
    );
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(scrolledPage).toBe(false);
    expect(updateImageFrame).toHaveBeenCalledTimes(1);
    expect(updateImageFrame).toHaveBeenCalledWith(
      IMAGE_ID,
      expect.objectContaining({ x: STORED_FRAME.x, y: STORED_FRAME.y }),
    );
    expect(updateImageFrame.mock.lastCall?.[1].zoom).toBeGreaterThan(
      STORED_FRAME.zoom,
    );
  });
});
