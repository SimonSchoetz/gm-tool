import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Encounter } from '@db/encounter';
import type * as encounterService from '@services/encounterService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { EncounterActions } from '../EncounterActions';

const getEncounterById = vi.hoisted(() =>
  vi.fn<typeof encounterService.getEncounterById>(),
);
const updateEncounter = vi.hoisted(() =>
  vi.fn<typeof encounterService.updateEncounter>(),
);

vi.mock('@services/encounterService', () => ({
  getEncounterById,
  updateEncounter,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return {
    useParams: encounterRouteParams,
    useRouter: () => ({ navigate: vi.fn() }),
    useNavigate: () => vi.fn(),
  };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanstackQueryClientProvider>
    <DeleteDialogProvider>{children}</DeleteDialogProvider>
  </TanstackQueryClientProvider>
);

// What the database holds, so a refetch after a write returns the saved flag.
let stored: Encounter;

const renderActions = async () => {
  render(<EncounterActions />, { wrapper: Wrapper });
  await screen.findByRole('checkbox', { name: 'Hide defeated' });
};

describe('EncounterActions', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stored = buildEncounter({ hide_defeated: 0 });
    getEncounterById.mockImplementation(() => Promise.resolve(stored));
    updateEncounter.mockReset().mockImplementation((_id, data) => {
      stored = {
        ...stored,
        hide_defeated: data.hide_defeated ?? stored.hide_defeated,
      };
      return Promise.resolve();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves hide_defeated 1 when the box is checked and 0 when it is unchecked again', async () => {
    const user = userEvent.setup();
    await renderActions();
    expect(
      screen.getByRole('checkbox', { name: 'Hide defeated' }),
    ).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Hide defeated' }));
    await act(() => vi.runOnlyPendingTimersAsync());
    await user.click(screen.getByRole('checkbox', { name: 'Hide defeated' }));
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateEncounter.mock.calls).toEqual([
      ['encounter-1', { hide_defeated: 1 }],
      ['encounter-1', { hide_defeated: 0 }],
    ]);
  });

  it('shows the box checked when hide_defeated is 1', async () => {
    stored = buildEncounter({ hide_defeated: 1 });
    await renderActions();

    expect(
      screen.getByRole('checkbox', { name: 'Hide defeated' }),
    ).toBeChecked();
  });
});
