import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStep } from '@db/session-step';
import type * as service from '@services/sessionStepService';
import {
  queryClient,
  sessionStepListQueryOptions,
  TanstackQueryClientProvider,
} from '@/data-access-layer';
import { InGameStepSection } from '../InGameStepSection';

const getStepsBySessionId = vi.hoisted(() =>
  vi.fn<typeof service.getStepsBySessionId>(),
);
const updateStep = vi.hoisted(() => vi.fn<typeof service.updateStep>());

vi.mock('@services/sessionStepService', () => ({
  getStepsBySessionId,
  updateStep,
}));

const SESSION_ID = 'session-1';

// Stands in for `useParams` of `@tanstack/react-router`: like the router, it answers the params of the route named by `from` and nothing for another route.
vi.mock('@tanstack/react-router', () => ({
  useParams: ({ from }: { from: string }) =>
    from === '/adventure/$adventureId/session/$sessionId'
      ? { adventureId: 'adventure-1', sessionId: SESSION_ID }
      : {},
}));

const STEP: SessionStep = {
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
};

const paragraphState = (text: string) =>
  JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });

// A checklist with one unchecked item.
const CHECKLIST_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Open the gate',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            version: 1,
            value: 1,
            checked: false,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'list',
        version: 1,
        listType: 'check',
        start: 1,
        tag: 'ul',
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

const renderSection = async () => {
  await queryClient.query(sessionStepListQueryOptions(SESSION_ID));
  return render(<InGameStepSection stepId={STEP.id} />, {
    wrapper: TanstackQueryClientProvider,
  });
};

const stepHeader = () => screen.getByRole('button', { name: 'Strong Start' });

describe('InGameStepSection', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient.clear();
    getStepsBySessionId.mockResolvedValue([STEP]);
    updateStep.mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('folds an unfolded step on a click of its header, saves it folded, and unfolds it on the next click', async () => {
    const user = userEvent.setup();
    await renderSection();
    expect(stepHeader()).toHaveAttribute('aria-expanded', 'true');

    await user.click(stepHeader());
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(stepHeader()).toHaveAttribute('aria-expanded', 'false');
    expect(updateStep).toHaveBeenLastCalledWith(STEP.id, { collapsed: 1 });

    await user.click(stepHeader());
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(stepHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(updateStep).toHaveBeenLastCalledWith(STEP.id, { collapsed: 0 });
  });

  it('shows the saved content of the step', async () => {
    getStepsBySessionId.mockResolvedValue([
      { ...STEP, content: paragraphState('Seed Strong Start content') },
    ]);

    await renderSection();

    expect(await screen.findByText('Seed Strong Start content')).toBeVisible();
  });

  it('saves the step content with the item checked when a checklist item of the read-only content is clicked', async () => {
    getStepsBySessionId.mockResolvedValue([
      { ...STEP, content: CHECKLIST_STATE },
    ]);
    await renderSection();

    const item = await screen.findByRole('checkbox');

    // jsdom computes no layout, so the item's box starts at 0 and a click at x 5 lies in the checkbox area the editor draws before the item.
    fireEvent.click(item, { clientX: 5 });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(updateStep).toHaveBeenCalledTimes(1);
    const [stepId, data] = updateStep.mock.calls[0];
    expect(stepId).toBe(STEP.id);
    expect(data.content).toContain('"checked":true');
  });
});
