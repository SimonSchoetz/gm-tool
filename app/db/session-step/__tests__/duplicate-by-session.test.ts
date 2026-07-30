import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExecute = vi.fn();
const mockSelect = vi.fn();

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({ execute: mockExecute, select: mockSelect }),
    ),
  },
}));

let generatedIdCounter = 0;
vi.mock('../../util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../util')>();
  return {
    ...actual,
    generateId: vi.fn(() => `new-step-id-${String(++generatedIdCounter)}`),
  };
});

const mockGetAllBySession = vi.fn();
vi.mock('../get-all-by-session', () => ({
  getAllBySession: (sessionId: string) =>
    mockGetAllBySession(sessionId) as unknown,
}));

import { duplicateBySession } from '../duplicate-by-session';

const sourceSteps = [
  {
    id: 'step-1',
    session_id: 'source-session-id',
    name: 'Strong Start',
    content: 'The wagon is ambushed',
    default_step_key: 'strong_start',
    checked: 1,
    sort_order: 0,
    created_at: '2023-05-01T08:00:00.000Z',
    updated_at: '2023-05-02T08:00:00.000Z',
  },
  {
    id: 'step-2',
    session_id: 'source-session-id',
    name: 'Custom Step',
    content: 'A player-authored note',
    default_step_key: null,
    checked: 0,
    sort_order: 1,
    created_at: '2023-05-01T08:00:00.000Z',
    updated_at: '2023-05-02T08:00:00.000Z',
  },
  {
    id: 'step-3',
    session_id: 'source-session-id',
    name: 'Magic Items',
    content: 'A +1 longsword',
    default_step_key: 'magic_items',
    checked: 0,
    sort_order: 5,
    created_at: '2023-05-01T08:00:00.000Z',
    updated_at: '2023-05-02T08:00:00.000Z',
  },
];

const INSERT_SQL =
  'INSERT INTO session_steps (id, name, content, default_step_key, checked, sort_order, session_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';

const stepInsertCalls = (): [string, unknown[]][] =>
  (mockExecute.mock.calls as [string, unknown[]][]).filter(
    ([sql]) => sql === INSERT_SQL,
  );

describe('sessionStep.duplicateBySession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generatedIdCounter = 0;
    mockSelect.mockResolvedValue([]);
    mockExecute.mockResolvedValue({});
    mockGetAllBySession.mockResolvedValue(sourceSteps);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('inserts one row per source step', async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    expect(stepInsertCalls()).toHaveLength(3);
  });

  it('attaches every copy to the target session', async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    for (const [, values] of stepInsertCalls()) {
      expect(values[6]).toBe('target-session-id');
      expect(values).not.toContain('source-session-id');
    }
  });

  it('copies content and checked, which create cannot express', async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    const [firstCall] = stepInsertCalls();
    expect(firstCall[1][2]).toBe('The wagon is ambushed');
    expect(firstCall[1][4]).toBe(1);

    const secondCall = stepInsertCalls()[1];
    expect(secondCall[1][2]).toBe('A player-authored note');
    expect(secondCall[1][4]).toBe(0);
  });

  it("preserves each step's sort_order", async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    expect(stepInsertCalls().map(([, values]) => values[5])).toEqual([0, 1, 5]);
  });

  it('copies default_step_key', async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    expect(stepInsertCalls().map(([, values]) => values[3])).toEqual([
      'strong_start',
      null,
      'magic_items',
    ]);
  });

  it('copies name rather than resetting it', async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    expect(stepInsertCalls().map(([, values]) => values[1])).toEqual([
      'Strong Start',
      'Custom Step',
      'Magic Items',
    ]);
  });

  it('generates fresh ids and fresh timestamps for each row', async () => {
    await duplicateBySession('source-session-id', 'target-session-id');

    const ids = stepInsertCalls().map(([, values]) => values[0]);
    expect(ids).toEqual(['new-step-id-1', 'new-step-id-2', 'new-step-id-3']);

    for (const [, values] of stepInsertCalls()) {
      expect(values[7]).toBe('2024-01-15T10:30:00.000Z');
      expect(values[8]).toBe('2024-01-15T10:30:00.000Z');
    }
  });

  it('inserts nothing when the source session has no steps', async () => {
    mockGetAllBySession.mockResolvedValue([]);

    await duplicateBySession('source-session-id', 'target-session-id');

    expect(stepInsertCalls()).toHaveLength(0);
  });
});
