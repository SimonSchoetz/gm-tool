import { useState } from 'react';
import { createPortal } from 'react-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PinnedPopupsProvider } from '@/providers/PinnedPopupsProvider';
import { usePinnedPopups } from '@/providers/PinnedPopupsContext';
import { MentionPopup, type PopupMode } from '../MentionPopup';

vi.mock('../components/MentionPopupContent', () => ({
  MentionPopupContent: () => {
    const [isButtonShown, setIsButtonShown] = useState(true);
    return (
      <>
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
}));

vi.mock('@/data-access-layer', () => ({
  useMentionEntityData: () => ({ deleted: false }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
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
