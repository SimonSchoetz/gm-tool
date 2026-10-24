import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PinnedPopupsProvider } from '@/providers/PinnedPopupsProvider';
import { MentionBadge } from '../MentionBadge';

const HOVER_DELAY_MS = 500;
const DELETED_ENTITY_ID = 'gone';

const navigateSpy = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateSpy,
  useRouterState: () => ({ location: { pathname: '/' } }),
}));

vi.mock('@/data-access-layer', () => ({
  useMentionEntityData: (entityId: string) => ({
    name: entityId === DELETED_ENTITY_ID ? null : `Name of ${entityId}`,
    deleted: entityId === DELETED_ENTITY_ID,
    loading: false,
  }),
  useTableConfigs: () => ({ tableConfigs: [] }),
  usePrefetchMentionEntity: () => ({ prefetchMentionEntity: vi.fn() }),
}));

vi.mock(
  '@/components/MentionPopup/components/MentionPopupContent',
  async () => {
    const { MentionPopupHeader } = await vi.importActual<{
      MentionPopupHeader: () => React.ReactNode;
    }>(
      '@/components/MentionPopup/components/MentionPopupHeader/MentionPopupHeader',
    );
    return {
      MentionPopupContent: ({ entityId }: { entityId: string }) => (
        <>
          <MentionPopupHeader />
          <div>popup of {entityId}</div>
        </>
      ),
    };
  },
);

const renderBadges = (...entityIds: string[]) => {
  render(
    <PinnedPopupsProvider>
      {entityIds.map((entityId) => (
        <MentionBadge
          key={entityId}
          entityId={entityId}
          entityType='npc'
          displayName={`Display of ${entityId}`}
          adventureId={null}
          format={[]}
        />
      ))}
    </PinnedPopupsProvider>,
  );
  return entityIds.map((entityId) =>
    screen.getByText(
      entityId === DELETED_ENTITY_ID
        ? `Display of ${entityId}`
        : `Name of ${entityId}`,
    ),
  );
};

const popupOf = (entityId: string) =>
  screen.queryByText(`popup of ${entityId}`);

const advanceTimers = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('MentionBadge popup opening', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigateSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the popup on a click and does not navigate', () => {
    const [badge] = renderBadges('goblin');

    fireEvent.click(badge);

    expect(popupOf('goblin')).not.toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('opens the popup on a click on a badge of a deleted entity', () => {
    const [badge] = renderBadges(DELETED_ENTITY_ID);

    fireEvent.click(badge);

    expect(screen.getByText(/^Deleted/)).toBeInTheDocument();
  });

  it('keeps a hover-opened popup open after a click when the pointer leaves the badge and the popup', () => {
    const [badge] = renderBadges('goblin');
    fireEvent.mouseEnter(badge);
    advanceTimers(HOVER_DELAY_MS);
    expect(popupOf('goblin')).not.toBeNull();

    fireEvent.click(badge);
    fireEvent.mouseLeave(badge);
    advanceTimers(HOVER_DELAY_MS);
    fireEvent.mouseLeave(screen.getByText('popup of goblin'));
    advanceTimers(HOVER_DELAY_MS);

    expect(popupOf('goblin')).not.toBeNull();
  });

  it('keeps the popup open on a second click on the same badge', () => {
    const [badge] = renderBadges('goblin');

    fireEvent.click(badge);
    fireEvent.click(badge);

    expect(popupOf('goblin')).not.toBeNull();
  });

  it("closes the open popup and shows the second badge's popup on a click on another badge", () => {
    const [first, second] = renderBadges('goblin', 'orc');
    fireEvent.click(first);

    fireEvent.click(second);

    expect(popupOf('goblin')).toBeNull();
    expect(popupOf('orc')).not.toBeNull();
  });

  it('keeps a pinned popup pinned after its badge is clicked', () => {
    const [badge] = renderBadges('goblin');
    fireEvent.click(badge);
    fireEvent.click(screen.getByRole('button', { name: 'Pin popup' }));

    fireEvent.click(badge);

    expect(popupOf('goblin')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Close popup' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pin popup' }),
    ).not.toBeInTheDocument();
  });

  it('opens no hover popup while the primary button is held, and opens one without it', () => {
    const [badge] = renderBadges('goblin');

    fireEvent.mouseEnter(badge, { buttons: 1 });
    advanceTimers(HOVER_DELAY_MS);
    expect(popupOf('goblin')).toBeNull();

    fireEvent.mouseEnter(badge);
    advanceTimers(HOVER_DELAY_MS);
    expect(popupOf('goblin')).not.toBeNull();
  });

  it('cancels the pending hover popup when the badge is pressed', () => {
    const [badge] = renderBadges('goblin');
    fireEvent.mouseEnter(badge);

    fireEvent.mouseDown(badge);
    advanceTimers(HOVER_DELAY_MS);

    expect(popupOf('goblin')).toBeNull();
  });

  it('opens no popup when the pointer moved between mousedown and click, and opens one when it did not', () => {
    const [badge] = renderBadges('goblin');

    fireEvent.mouseDown(badge, { clientX: 10, clientY: 10 });
    fireEvent.click(badge, { clientX: 80, clientY: 10 });
    expect(popupOf('goblin')).toBeNull();

    fireEvent.mouseDown(badge, { clientX: 10, clientY: 10 });
    fireEvent.click(badge, { clientX: 10, clientY: 10 });
    expect(popupOf('goblin')).not.toBeNull();
  });
});
