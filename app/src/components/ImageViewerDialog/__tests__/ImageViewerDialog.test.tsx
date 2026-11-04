import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as service from '@services/imageService';
import {
  imageQueryOptions,
  queryClient,
  TanstackQueryClientProvider,
} from '@/data-access-layer';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { ImageViewerDialog } from '../ImageViewerDialog';

const getImageById = vi.hoisted(() => vi.fn<typeof service.getImageById>());
const getImageUrl = vi.hoisted(() => vi.fn<typeof service.getImageUrl>());
const updateImageFrame = vi.hoisted(() =>
  vi.fn<typeof service.updateImageFrame>(),
);

const pickImageFile = vi.hoisted(() => vi.fn<() => Promise<string | null>>());

vi.mock('@services/imageService', () => ({
  getImageById,
  getImageUrl,
  updateImageFrame,
}));
vi.mock('@/util/pickImageFile', () => ({ pickImageFile }));

const IMAGE_ID = 'image-1';
const uploadFn = vi.fn();
const deleteFn = vi.fn();

const EditableViewer = ({
  initialState = 'closed',
}: {
  initialState?: 'open' | 'closed';
}) => {
  const [state, setState] = useState<'open' | 'closed'>(initialState);
  return (
    <>
      <button
        type='button'
        onClick={() => {
          setState('open');
        }}
      >
        Open viewer
      </button>
      <ImageViewerDialog
        image_id={IMAGE_ID}
        title='Goblin'
        state={state}
        setState={setState}
        editing={{
          uploadFn,
          deleteFn,
          dimensions: { width: 400, height: 300 },
        }}
      />
    </>
  );
};

describe('ImageViewerDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient.clear();
    getImageById.mockResolvedValue({
      id: IMAGE_ID,
      file_extension: 'png',
      frame_x: 50,
      frame_y: 50,
      frame_zoom: 1,
      created_at: '2026-01-10T09:00:00.000Z',
      updated_at: '2026-01-10T09:00:00.000Z',
    });
    getImageUrl.mockResolvedValue('asset://image-1.png');
    updateImageFrame.mockResolvedValue(undefined);
    uploadFn.mockReset();
    deleteFn.mockReset();
    pickImageFile.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const openViewer = async () => {
    // The image is cached before the viewer opens, as the card behind it shows it first.
    await queryClient.query(imageQueryOptions(IMAGE_ID));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EditableViewer />, {
      wrapper: ({ children }) => (
        <TanstackQueryClientProvider>
          <DeleteDialogProvider>{children}</DeleteDialogProvider>
        </TanstackQueryClientProvider>
      ),
    });
    await user.click(screen.getByRole('button', { name: 'Open viewer' }));
    return user;
  };

  const expectViewerClosed = () => {
    expect(
      screen.queryByRole('button', { name: 'Toggle framing' }),
    ).not.toBeInTheDocument();
  };

  it('opens on the image again after it was closed in framing mode', async () => {
    const user = await openViewer();

    expect(
      screen.getByRole('img', { name: 'Goblin image' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle framing' }));

    expect(
      screen.getByRole('img', { name: 'Framing preview' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'Goblin image' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    // The dialog keeps what it showed while it fades out.
    expect(
      screen.getByRole('img', { name: 'Framing preview' }),
    ).toBeInTheDocument();

    await act(() => vi.runOnlyPendingTimersAsync());
    await user.click(screen.getByRole('button', { name: 'Open viewer' }));

    expect(
      screen.queryByRole('img', { name: 'Framing preview' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Goblin image' }),
    ).toBeInTheDocument();
  });

  it('shows the image when it is mounted open', async () => {
    await queryClient.query(imageQueryOptions(IMAGE_ID));
    render(<EditableViewer initialState='open' />, {
      wrapper: ({ children }) => (
        <TanstackQueryClientProvider>
          <DeleteDialogProvider>{children}</DeleteDialogProvider>
        </TanstackQueryClientProvider>
      ),
    });

    expect(
      await screen.findByRole('img', { name: 'Goblin image' }),
    ).toBeInTheDocument();
  });

  it('goes back from framing to the image on a second toggle', async () => {
    const user = await openViewer();

    await user.click(screen.getByRole('button', { name: 'Toggle framing' }));
    await user.click(screen.getByRole('button', { name: 'Toggle framing' }));

    expect(
      screen.queryByRole('img', { name: 'Framing preview' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Goblin image' }),
    ).toBeInTheDocument();
  });

  it('deletes the image after its confirmation, naming it by its title, and closes the viewer', async () => {
    const user = await openViewer();

    await user.click(screen.getByRole('button', { name: 'Delete image' }));

    expect(
      screen.getByRole('heading', { name: 'Delete Goblin image' }),
    ).toBeInTheDocument();
    expect(deleteFn).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(deleteFn).toHaveBeenCalledTimes(1);
    expectViewerClosed();
  });

  it('replaces the image with the file picked and closes the viewer', async () => {
    pickImageFile.mockResolvedValue('/pictures/goblin.png');
    const user = await openViewer();

    await user.click(screen.getByRole('button', { name: 'Replace image' }));
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(pickImageFile).toHaveBeenCalledExactlyOnceWith();
    expect(uploadFn).toHaveBeenCalledExactlyOnceWith('/pictures/goblin.png');
    expectViewerClosed();
  });

  it('keeps the image and the viewer when no file is picked', async () => {
    pickImageFile.mockResolvedValue(null);
    const user = await openViewer();

    await user.click(screen.getByRole('button', { name: 'Replace image' }));
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(uploadFn).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Toggle framing' }),
    ).toBeInTheDocument();
  });
});
