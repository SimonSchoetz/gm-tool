import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PinnedPopupsProvider } from '@/providers/PinnedPopupsProvider';
import { MentionBadge } from '../MentionBadge';

const HOVER_DELAY_MS = 500;
const DELETED_ENTITY_ID = 'gone';

const navigateSpy = vi.hoisted(() => vi.fn());
const prefetchMentionEntity = vi.hoisted(() => vi.fn());
const tableConfigs = vi.hoisted(() => ({
  value: [] as { table_name: string; color: string }[],
}));

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
  useTableConfigs: () => ({ tableConfigs: tableConfigs.value }),
  usePrefetchMentionEntity: () => ({ prefetchMentionEntity }),
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
    prefetchMentionEntity.mockClear();
    tableConfigs.value = [];
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

  it('cancels the pending hover popup when the pointer leaves the badge', () => {
    const [badge] = renderBadges('goblin');
    fireEvent.mouseEnter(badge);

    fireEvent.mouseLeave(badge);
    advanceTimers(HOVER_DELAY_MS);

    expect(popupOf('goblin')).toBeNull();
  });

  it.each([
    ['below the badge', { top: 100, bottom: 120 }, '120px'],
    ['above the badge', { top: 600, bottom: 620 }, '600px'],
  ])('opens the popup %s at the badge', (_, rect, expectedY) => {
    const [badge] = renderBadges('goblin');
    badge.getBoundingClientRect = () =>
      ({ ...rect, left: 150, right: 200 }) as DOMRect;

    fireEvent.click(badge);

    const popup = screen
      .getByText('popup of goblin')
      .closest<HTMLElement>('[style]');
    expect(popup?.style.getPropertyValue('--rt-mention-pop-up-x')).toBe(
      '150px',
    );
    expect(popup?.style.getPropertyValue('--rt-mention-pop-up-y')).toBe(
      expectedY,
    );
  });
});

const renderOne = (entityId = 'goblin', format: ('bold' | 'italic')[] = []) => {
  const rendered = render(
    <PinnedPopupsProvider>
      <MentionBadge
        entityId={entityId}
        entityType='npc'
        displayName={`Display of ${entityId}`}
        adventureId={null}
        format={format}
      />
    </PinnedPopupsProvider>,
  );
  return {
    ...rendered,
    badge: screen.getByText(
      entityId === DELETED_ENTITY_ID
        ? `Display of ${entityId}`
        : `Name of ${entityId}`,
    ),
  };
};

describe('MentionBadge hover and popup bridge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigateSpy.mockClear();
    prefetchMentionEntity.mockClear();
    tableConfigs.value = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const hoverOpen = () => {
    const { badge, ...rest } = renderOne();
    fireEvent.mouseEnter(badge);
    advanceTimers(HOVER_DELAY_MS);
    return { badge, popup: screen.getByText('popup of goblin'), ...rest };
  };

  it('prefetches the entity when the pointer enters the badge, and not while the primary button is held', () => {
    const { badge } = renderOne();

    fireEvent.mouseEnter(badge, { buttons: 1 });
    expect(prefetchMentionEntity).not.toHaveBeenCalled();

    fireEvent.mouseEnter(badge);
    expect(prefetchMentionEntity).toHaveBeenCalledTimes(1);
  });

  it('closes a hover popup when the pointer leaves the badge and is not on the popup', () => {
    const { badge } = hoverOpen();

    fireEvent.mouseLeave(badge);
    advanceTimers(0);

    expect(popupOf('goblin')).toBeNull();
  });

  it('keeps the popup open while the pointer moves from the badge onto it, and closes it when the pointer leaves the popup', () => {
    const { badge, popup } = hoverOpen();

    fireEvent.mouseLeave(badge);
    fireEvent.mouseEnter(popup);
    advanceTimers(HOVER_DELAY_MS);
    expect(popupOf('goblin')).not.toBeNull();

    fireEvent.mouseLeave(popup);
    expect(popupOf('goblin')).toBeNull();
  });

  it('keeps the popup open when the pointer leaves the badge while it is on the popup', () => {
    const { badge, popup } = hoverOpen();
    fireEvent.mouseEnter(popup);

    fireEvent.mouseLeave(badge);
    advanceTimers(HOVER_DELAY_MS);

    expect(popupOf('goblin')).not.toBeNull();
  });

  it('closes a later hover popup when the pointer leaves the badge without ever entering it, after an earlier popup was entered and left', () => {
    const { badge, popup } = hoverOpen();
    fireEvent.mouseEnter(popup);
    fireEvent.mouseLeave(popup);
    expect(popupOf('goblin')).toBeNull();

    fireEvent.mouseLeave(badge);
    fireEvent.mouseEnter(badge);
    advanceTimers(HOVER_DELAY_MS);
    expect(popupOf('goblin')).not.toBeNull();
    fireEvent.mouseLeave(badge);
    advanceTimers(0);

    expect(popupOf('goblin')).toBeNull();
  });

  it('opens no second hover popup for a badge whose popup a click already opened', () => {
    const { badge } = renderOne();
    fireEvent.click(badge);

    fireEvent.mouseEnter(badge);
    advanceTimers(HOVER_DELAY_MS);
    fireEvent.mouseLeave(badge);
    advanceTimers(0);

    expect(prefetchMentionEntity).not.toHaveBeenCalled();
    expect(popupOf('goblin')).not.toBeNull();
  });

  it('keeps a popup that a click opened open when the delay of the hover before it runs out', () => {
    const { badge } = renderOne();
    fireEvent.mouseEnter(badge);

    fireEvent.click(badge);
    advanceTimers(HOVER_DELAY_MS);
    fireEvent.mouseLeave(badge);
    advanceTimers(0);

    expect(popupOf('goblin')).not.toBeNull();
  });

  it('opens no popup for a badge that was removed while its hover delay was running', () => {
    const { badge, rerender } = renderOne();
    fireEvent.mouseEnter(badge);

    rerender(<PinnedPopupsProvider>{null}</PinnedPopupsProvider>);
    advanceTimers(HOVER_DELAY_MS);

    expect(popupOf('goblin')).toBeNull();
  });

  it('opens a popup above the badge only when the badge is below the middle of the window', () => {
    const { badge } = renderOne();
    badge.getBoundingClientRect = () =>
      ({
        top: window.innerHeight / 2,
        bottom: window.innerHeight / 2 + 20,
        left: 10,
        right: 60,
      }) as DOMRect;

    fireEvent.click(badge);

    const popup = screen
      .getByText('popup of goblin')
      .closest<HTMLElement>('[style]');
    expect(popup?.style.getPropertyValue('--rt-mention-pop-up-y')).toBe(
      `${String(window.innerHeight / 2 + 20)}px`,
    );
  });
});

describe('MentionBadge table color', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    tableConfigs.value = [
      { table_name: 'foes', color: '9, 9, 9' },
      { table_name: 'npc', color: '1, 2, 3' },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
    tableConfigs.value = [];
  });

  it('takes the color of the table config of its entity type', () => {
    const { badge } = renderOne();

    expect(badge.style.getPropertyValue('--rt-mention-badge-color')).toBe(
      '1, 2, 3',
    );
  });

  it('carries no table color when no config matches its entity type', () => {
    tableConfigs.value = [{ table_name: 'foes', color: '9, 9, 9' }];
    const { badge } = renderOne();

    expect(badge.style.getPropertyValue('--rt-mention-badge-color')).toBe('');
  });

  it('carries no table color when its entity was deleted', () => {
    const { badge } = renderOne(DELETED_ENTITY_ID);

    expect(badge.style.getPropertyValue('--rt-mention-badge-color')).toBe('');
  });
});
