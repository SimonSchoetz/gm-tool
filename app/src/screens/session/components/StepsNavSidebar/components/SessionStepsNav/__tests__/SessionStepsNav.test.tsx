import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@db/session';
import type { SessionStep } from '@db/session-step';
import type * as sessionService from '@services/sessionService';
import type * as stepService from '@services/sessionStepService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { stepSectionElementId } from '../../../../../helper/stepSectionElementId';
import { SessionStepsNav } from '../SessionStepsNav';

const getSessionById = vi.hoisted(() =>
  vi.fn<typeof sessionService.getSessionById>(),
);
const getStepsBySessionId = vi.hoisted(() =>
  vi.fn<typeof stepService.getStepsBySessionId>(),
);
const updateStep = vi.hoisted(() => vi.fn<typeof stepService.updateStep>());
const createCustomStep = vi.hoisted(() =>
  vi.fn<typeof stepService.createCustomStep>(),
);

vi.mock('@services/sessionService', () => ({ getSessionById }));
vi.mock('@services/sessionStepService', () => ({
  getStepsBySessionId,
  updateStep,
  createCustomStep,
}));

const SESSION_ID = 'session-1';

// Stands in for `useParams` of `@tanstack/react-router`: like the router, it answers the params of the route named by `from` and nothing for another route.
vi.mock('@tanstack/react-router', () => ({
  useParams: ({ from }: { from: string }) =>
    from === '/adventure/$adventureId/session/$sessionId'
      ? { adventureId: 'adventure-1', sessionId: SESSION_ID }
      : {},
}));

const buildStep = (overrides: Partial<SessionStep>): SessionStep => ({
  id: 'step-1',
  session_id: SESSION_ID,
  name: 'Strong Start',
  content: null,
  default_step_key: null,
  checked: 0,
  collapsed: 0,
  sort_order: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
  ...overrides,
});

const buildSession = (activeView: Session['active_view']): Session => ({
  id: SESSION_ID,
  name: 'Seed Session',
  description: null,
  summary: null,
  session_date: null,
  active_view: activeView,
  adventure_id: 'adventure-1',
  pinned_order: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

const scrollIntoView = vi.fn();

// The nav scrolls to the step's section element, which the session screen renders beside it.
const mountSection = (stepId: string) => {
  const section = document.createElement('div');
  section.id = stepSectionElementId(stepId);
  section.scrollIntoView = scrollIntoView;
  document.body.append(section);
  return section;
};

// The nav lists an unfolded first step beside the clicked one, so a handler that reads another step's fold state shows.
const clickStepInNav = async (
  session: Promise<Session>,
  clicked: SessionStep,
) => {
  const user = userEvent.setup();
  const first = buildStep({ id: 'step-0', name: 'Player Characters' });
  getSessionById.mockReturnValue(session);
  getStepsBySessionId.mockResolvedValue([first, clicked]);
  mountSection(first.id);
  mountSection(clicked.id);
  render(<SessionStepsNav />, { wrapper: TanstackQueryClientProvider });

  await user.click(
    await screen.findByRole('button', { name: clicked.name ?? '' }),
  );
  await act(() => vi.runOnlyPendingTimersAsync());
};

describe('SessionStepsNav', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient.clear();
    scrollIntoView.mockReset();
    updateStep.mockReset().mockResolvedValue();
    createCustomStep.mockReset().mockResolvedValue('new-step');
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('unfolds and saves a folded step clicked in the in-game view, and scrolls to it', async () => {
    await clickStepInNav(
      Promise.resolve(buildSession('ingame')),
      buildStep({ collapsed: 1 }),
    );

    expect(updateStep).toHaveBeenCalledTimes(1);
    expect(updateStep).toHaveBeenCalledWith('step-1', { collapsed: 0 });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('only scrolls to an unfolded step clicked in the in-game view', async () => {
    await clickStepInNav(
      Promise.resolve(buildSession('ingame')),
      buildStep({ collapsed: 0 }),
    );

    expect(updateStep).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('only scrolls to a folded step clicked in the prep view', async () => {
    await clickStepInNav(
      Promise.resolve(buildSession('prep')),
      buildStep({ collapsed: 1 }),
    );

    expect(updateStep).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('only scrolls to a folded step clicked before the session has loaded', async () => {
    await clickStepInNav(
      new Promise<Session>(() => undefined),
      buildStep({ collapsed: 1 }),
    );

    expect(updateStep).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('scrolls the clicked step to the top of the page, smoothly', async () => {
    await clickStepInNav(
      Promise.resolve(buildSession('ingame')),
      buildStep({ collapsed: 0 }),
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('does nothing when the section of the clicked step is not on the page', async () => {
    const user = userEvent.setup();
    getSessionById.mockReturnValue(Promise.resolve(buildSession('ingame')));
    getStepsBySessionId.mockResolvedValue([buildStep({ collapsed: 0 })]);
    render(<SessionStepsNav />, { wrapper: TanstackQueryClientProvider });

    await user.click(
      await screen.findByRole('button', { name: 'Strong Start' }),
    );
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(updateStep).not.toHaveBeenCalled();
  });

  it('offers an Add step button in the prep view that adds a step to the session', async () => {
    const user = userEvent.setup();
    getSessionById.mockReturnValue(Promise.resolve(buildSession('prep')));
    getStepsBySessionId.mockResolvedValue([buildStep({})]);
    render(<SessionStepsNav />, { wrapper: TanstackQueryClientProvider });

    await user.click(await screen.findByRole('button', { name: 'Add step' }));
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(createCustomStep).toHaveBeenCalledWith(SESSION_ID, undefined);
  });

  it.each([
    ['the in-game view', Promise.resolve(buildSession('ingame'))],
    ['a session that has not loaded', new Promise<Session>(() => undefined)],
  ])('offers no Add step button in %s', async (_name, session) => {
    getSessionById.mockReturnValue(session);
    getStepsBySessionId.mockResolvedValue([buildStep({})]);
    render(<SessionStepsNav />, { wrapper: TanstackQueryClientProvider });

    await screen.findByRole('button', { name: 'Strong Start' });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(screen.queryByRole('button', { name: 'Add step' })).toBeNull();
  });
});
