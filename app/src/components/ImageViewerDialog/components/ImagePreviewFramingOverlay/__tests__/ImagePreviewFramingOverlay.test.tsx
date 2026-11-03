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
// The zoom a wheel delta of 1 adds, as the overlay reads it.
const ZOOM_PER_WHEEL_DELTA = 0.001;
const setPointerCapture = vi.fn();

const framingPreview = () =>
  screen.getByRole('img', { name: 'Framing preview' });

const renderOverlay = async () => {
  // The dialog shows the image before framing starts, so its query is cached when the overlay mounts.
  await queryClient.query(imageQueryOptions(IMAGE_ID));
  render(
    <ImagePreviewFramingOverlay
      imageId={IMAGE_ID}
      dimensions={{ width: 400, height: 300 }}
    />,
    { wrapper: TanstackQueryClientProvider },
  );
};

describe('ImagePreviewFramingOverlay', () => {
  beforeEach(() => {
    // jsdom has no pointer capture, which the overlay takes on a press.
    HTMLElement.prototype.setPointerCapture = setPointerCapture;
    setPointerCapture.mockReset();
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
    expect(updateImageFrame.mock.lastCall?.[1].zoom).toBeCloseTo(
      STORED_FRAME.zoom + 100 * ZOOM_PER_WHEEL_DELTA,
    );
  });

  describe.each([
    ['a scroll down', 1_000_000, 1],
    ['a long scroll up', -1_000_000, 5],
  ])('on %s', (_label, deltaY, expectedZoom) => {
    it(`keeps the zoom between 1 and 5, saving ${expectedZoom}`, async () => {
      await renderOverlay();

      fireEvent.wheel(framingPreview(), { deltaY });
      await act(() => vi.runOnlyPendingTimersAsync());

      expect(updateImageFrame.mock.lastCall?.[1].zoom).toBe(expectedZoom);
    });
  });

  it('saves a changed frame for the image the overlay shows now when the image changes', async () => {
    await queryClient.query(imageQueryOptions(IMAGE_ID));
    const view = render(
      <ImagePreviewFramingOverlay
        imageId={IMAGE_ID}
        dimensions={{ width: 400, height: 300 }}
      />,
      { wrapper: TanstackQueryClientProvider },
    );

    await queryClient.query(imageQueryOptions('image-2'));
    view.rerender(
      <ImagePreviewFramingOverlay
        imageId='image-2'
        dimensions={{ width: 400, height: 300 }}
      />,
    );
    fireEvent.wheel(framingPreview(), { deltaY: -100 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateImageFrame).toHaveBeenCalledWith(
      'image-2',
      expect.objectContaining({ zoom: expect.any(Number) as number }),
    );
  });

  it('saves nothing for a frame the user has not changed', async () => {
    await renderOverlay();

    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateImageFrame).not.toHaveBeenCalled();
  });

  it('starts from the default frame for an image with no stored frame', async () => {
    getImageById.mockResolvedValue({
      id: IMAGE_ID,
      file_extension: 'png',
      frame_x: null,
      frame_y: null,
      frame_zoom: null,
      created_at: '2026-01-10T09:00:00.000Z',
      updated_at: '2026-01-10T09:00:00.000Z',
    });
    await renderOverlay();

    fireEvent.wheel(framingPreview(), { deltaY: -100 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateImageFrame).toHaveBeenCalledWith(
      IMAGE_ID,
      expect.objectContaining({ x: 50, y: 0 }),
    );
  });

  it('pans the frame by the pointer distance over the preview divided by the zoom, and saves it', async () => {
    await renderOverlay();

    fireEvent.pointerDown(framingPreview(), {
      clientX: 200,
      clientY: 150,
      pointerId: 7,
    });
    fireEvent.pointerMove(framingPreview(), { clientX: 240, clientY: 180 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(setPointerCapture).toHaveBeenCalledWith(7);
    expect(updateImageFrame).toHaveBeenCalledTimes(1);
    expect(updateImageFrame).toHaveBeenCalledWith(IMAGE_ID, {
      x: STORED_FRAME.x - 5,
      y: STORED_FRAME.y - 5,
      zoom: STORED_FRAME.zoom,
    });
  });

  it('pans from where the pointer was last, not from where it was pressed', async () => {
    await renderOverlay();

    fireEvent.pointerDown(framingPreview(), { clientX: 200, clientY: 150 });
    fireEvent.pointerMove(framingPreview(), { clientX: 240, clientY: 150 });
    fireEvent.pointerMove(framingPreview(), { clientX: 280, clientY: 150 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateImageFrame.mock.lastCall?.[1].x).toBe(STORED_FRAME.x - 10);
  });

  it('does not pan on a pointer move that no press on the preview started', async () => {
    await renderOverlay();

    fireEvent.pointerMove(framingPreview(), { clientX: 240, clientY: 180 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateImageFrame).not.toHaveBeenCalled();
  });

  it.each([
    ['released', fireEvent.pointerUp],
    ['moved off the preview', fireEvent.pointerLeave],
  ])('stops panning once the pointer is %s', async (_label, endDrag) => {
    await renderOverlay();

    fireEvent.pointerDown(framingPreview(), { clientX: 200, clientY: 150 });
    endDrag(framingPreview());
    fireEvent.pointerMove(framingPreview(), { clientX: 240, clientY: 180 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateImageFrame).not.toHaveBeenCalled();
  });
});
