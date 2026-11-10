import type { ReactNode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as service from '@services/imageService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { EntityPopupBody } from '../EntityPopupBody';

const getImageById = vi.hoisted(() => vi.fn<typeof service.getImageById>());
const getImageUrl = vi.hoisted(() => vi.fn<typeof service.getImageUrl>());

vi.mock('@services/imageService', () => ({ getImageById, getImageUrl }));

const IMAGE_ID = 'image-1';

const Providers = ({ children }: { children: ReactNode }) => (
  <TanstackQueryClientProvider>
    <DeleteDialogProvider>{children}</DeleteDialogProvider>
  </TanstackQueryClientProvider>
);

const renderBody = (onImageOpen?: () => void) =>
  render(
    <EntityPopupBody
      imageId={IMAGE_ID}
      imageTitle='Goblin'
      {...(onImageOpen && { onImageOpen })}
    />,
    { wrapper: Providers },
  );

const renderBodyWithoutImage = () =>
  render(<EntityPopupBody imageId={null} imageTitle={null} />, {
    wrapper: Providers,
  });

describe('EntityPopupBody', () => {
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the image full screen on a click, with no replace, delete or framing control, and closes it again', async () => {
    const user = userEvent.setup();
    renderBody();

    await user.click(screen.getByRole('button', { name: 'View image' }));

    expect(
      within(screen.getByRole('dialog')).getByText('Goblin'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Replace image' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete image' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Toggle framing' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the image in the viewer by the entity name, and by nothing but "image" for an unnamed entity', async () => {
    const user = userEvent.setup();
    render(<EntityPopupBody imageId={IMAGE_ID} imageTitle={null} />, {
      wrapper: Providers,
    });

    await user.click(screen.getByRole('button', { name: 'View image' }));

    expect(
      await within(screen.getByRole('dialog')).findByRole('img', {
        name: 'image',
      }),
    ).toBeInTheDocument();
  });

  it('offers no image to click when the entity has none', () => {
    renderBodyWithoutImage();

    expect(
      screen.queryByRole('button', { name: 'View image' }),
    ).not.toBeInTheDocument();
  });

  it('calls onImageOpen once for each click on the image', async () => {
    const user = userEvent.setup();
    const onImageOpen = vi.fn();
    renderBody(onImageOpen);

    await user.click(screen.getByRole('button', { name: 'View image' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await act(() => vi.runOnlyPendingTimersAsync());
    await user.click(screen.getByRole('button', { name: 'View image' }));

    expect(onImageOpen).toHaveBeenCalledTimes(2);
  });
});
