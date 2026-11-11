import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PinnedPopupsProvider } from '@/providers/PinnedPopupsProvider';
import { usePinnedPopups } from '@/providers/PinnedPopupsContext';
import { MentionPopup, type PopupMode } from '../MentionPopup';

const navigateSpy = vi.hoisted(() => vi.fn());

vi.mock('../components/MentionPopupContent', async () => {
  const { MentionPopupHeader } = await vi.importActual<{
    MentionPopupHeader: () => React.ReactNode;
  }>('../components/MentionPopupHeader/MentionPopupHeader');
  const { useMentionPopupHeader } = await vi.importActual<{
    useMentionPopupHeader: () => { zIndex: number | null };
  }>('../hooks/useMentionPopupHeader');
  return {
    MentionPopupContent: () => {
      const [isButtonShown, setIsButtonShown] = useState(true);
      const header = useMentionPopupHeader();
      return (
        <>
          <MentionPopupHeader />
          <span>{`z-index ${String(header.zIndex)}`}</span>
          <button>inside</button>
          {isButtonShown && (
            <button
              onClick={() => {
                setIsButtonShown(false);
              }}
            >
              vanishing
            </button>
          )}
          {createPortal(<button>portaled</button>, document.body)}
        </>
      );
    },
  };
});

vi.mock('@/data-access-layer', () => ({
  useMentionEntityData: () => ({ deleted: false }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateSpy,
  useRouterState: () => ({ location: { pathname: '/' } }),
}));

const renderPopup = (mode: PopupMode) => {
  const onRemove = vi.fn();
  render(
    <MentionPopup
      entityId='goblin'
      entityType='npc'
      adventureId={null}
      name='Goblin'
      position={{ x: 10, y: 20 }}
      placement='below'
      mode={mode}
      onRemove={onRemove}
    />,
  );
  return { onRemove, user: userEvent.setup() };
};

describe('MentionPopup dismissal', () => {
  it.each(['inside', 'vanishing', 'portaled'])(
    'stays open on a click on the %s button, even when the button is gone or portaled out of the popup',
    async (name) => {
      const { onRemove, user } = renderPopup('click');

      await user.click(screen.getByRole('button', { name }));

      expect(onRemove).not.toHaveBeenCalled();
    },
  );

  it('closes a click-opened popup on a click outside', async () => {
    const { onRemove, user } = renderPopup('click');

    await user.click(document.body);

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('closes a click-opened popup on Escape', async () => {
    const { onRemove, user } = renderPopup('click');

    await user.keyboard('{Escape}');

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('stays open when the pointer leaves a click-opened popup', async () => {
    const { onRemove, user } = renderPopup('click');

    await user.unhover(screen.getByRole('button', { name: 'inside' }));

    expect(onRemove).not.toHaveBeenCalled();
  });

  it('closes a hover popup when the pointer leaves it', async () => {
    const { onRemove, user } = renderPopup('hover');

    await user.hover(screen.getByRole('button', { name: 'inside' }));
    await user.unhover(screen.getByRole('button', { name: 'inside' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape on a pinned popup', async () => {
    const { onRemove, user } = renderPopup('pinned');

    await user.keyboard('{Escape}');
    await user.click(document.body);

    expect(onRemove).not.toHaveBeenCalled();
  });
});

const OpenButtons = () => {
  const { openPopupByClick } = usePinnedPopups();
  const open = (x: number) => {
    openPopupByClick({
      entityId: 'goblin',
      entityType: 'npc',
      adventureId: null,
      name: 'Goblin',
      position: { x, y: 100 },
      placement: 'below',
    });
  };
  return (
    <>
      <button
        data-mention-anchor='goblin'
        onClick={() => {
          open(100);
        }}
      >
        open at first badge
      </button>
      <button
        data-mention-anchor='goblin'
        onClick={() => {
          open(500);
        }}
      >
        open at second badge
      </button>
    </>
  );
};

describe('PinnedPopupsProvider re-anchoring', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('moves a click-opened popup to the newly clicked badge of the same entity', async () => {
    const user = userEvent.setup();
    render(
      <PinnedPopupsProvider>
        <OpenButtons />
      </PinnedPopupsProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'open at first badge' }),
    );
    const popupX = () =>
      screen
        .getByRole('button', { name: 'inside' })
        .closest<HTMLElement>('[style]')
        ?.style.getPropertyValue('--rt-mention-pop-up-x');
    expect(popupX()).toBe('100px');

    await user.click(
      screen.getByRole('button', { name: 'open at second badge' }),
    );

    expect(popupX()).toBe('500px');
  });
});

type PopupProps = Partial<React.ComponentProps<typeof MentionPopup>>;

const renderConfigured = (props: PopupProps = {}) => {
  const onRemove = vi.fn();
  render(
    <MentionPopup
      entityId='goblin'
      entityType='npcs'
      adventureId={null}
      name='Goblin'
      position={{ x: 10, y: 20 }}
      placement='below'
      mode='click'
      onRemove={onRemove}
      {...props}
    />,
  );
  return { onRemove, user: userEvent.setup() };
};

const popupStyleOf = () =>
  screen
    .getByRole('button', { name: 'inside' })
    .closest<HTMLElement>('[style]');

describe('MentionPopup position', () => {
  const POPUP_WIDTH = 200;
  const POPUP_HEIGHT = 100;

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [
      'keeps a popup below its anchor inside the right and bottom edges of the window',
      'below',
      { x: window.innerWidth + 500, y: window.innerHeight + 500 },
      {
        x: window.innerWidth - POPUP_WIDTH,
        y: window.innerHeight - POPUP_HEIGHT,
      },
    ],
    [
      'keeps a popup below its anchor inside the left and top edges of the window',
      'below',
      { x: -30, y: -30 },
      { x: 0, y: 0 },
    ],
    [
      'leaves a popup that fits where its anchor put it',
      'below',
      { x: 40, y: 60 },
      { x: 40, y: 60 },
    ],
    [
      'puts a popup above its anchor with its bottom edge no higher than its own height from the top of the window',
      'above',
      { x: 5, y: 30 },
      { x: 5, y: POPUP_HEIGHT },
    ],
    [
      'keeps a popup above its anchor from going below the window',
      'above',
      { x: 5, y: window.innerHeight + 500 },
      { x: 5, y: window.innerHeight },
    ],
  ] as const)('%s', (_name, placement, position, expected) => {
    renderConfigured({ placement, position });

    const style = popupStyleOf();
    expect(style?.style.getPropertyValue('--rt-mention-pop-up-x')).toBe(
      `${String(expected.x)}px`,
    );
    expect(style?.style.getPropertyValue('--rt-mention-pop-up-y')).toBe(
      `${String(expected.y)}px`,
    );
  });

  it('places a pinned popup again, inside the window, after it was dragged', () => {
    Element.prototype.setPointerCapture = vi.fn();
    renderConfigured({ mode: 'pinned', position: { x: 40, y: 60 } });
    const title = screen.getByText(/Goblin/);

    fireEvent.pointerDown(title, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(title, {
      clientX: window.innerWidth,
      clientY: 10,
      pointerId: 1,
    });

    expect(
      popupStyleOf()?.style.getPropertyValue('--rt-mention-pop-up-x'),
    ).toBe(`${String(window.innerWidth - POPUP_WIDTH)}px`);
  });
});

describe('MentionPopup header actions', () => {
  beforeEach(() => {
    navigateSpy.mockClear();
  });

  it('closes the popup and navigates to the entity page on Navigate to entity', async () => {
    const { onRemove, user } = renderConfigured({ adventureId: 'adventure-1' });

    await user.click(
      screen.getByRole('button', { name: 'Navigate to entity' }),
    );

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: '/adventure/adventure-1/npc/goblin',
    });
  });

  it('asks to pin the popup on Pin popup, and does nothing when no pin handler was given', async () => {
    const onPin = vi.fn();
    const { user } = renderConfigured({ mode: 'hover', onPin });

    await user.click(screen.getByRole('button', { name: 'Pin popup' }));

    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it('survives Pin popup without a pin handler', async () => {
    const { user } = renderConfigured({ mode: 'hover' });

    await user.click(screen.getByRole('button', { name: 'Pin popup' }));

    expect(
      screen.getByRole('button', { name: 'Pin popup' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['gives the content the stacking order of the popup', 1234, 'z-index 1234'],
    [
      'gives the content no stacking order when the popup has none',
      undefined,
      'z-index null',
    ],
  ])('%s', (_name, zIndex, shown) => {
    renderConfigured(zIndex === undefined ? {} : { zIndex });

    expect(screen.getByText(shown)).toBeInTheDocument();
    expect(popupStyleOf()?.style.zIndex ?? '').toBe(
      zIndex === undefined ? '' : String(zIndex),
    );
  });
});
