import type { Session } from '@db/session';
import type { SessionStep } from '@db/session-step';

export const buildSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  name: null,
  description: null,
  summary: null,
  session_date: null,
  active_view: 'prep',
  adventure_id: 'adventure-1',
  pinned_order: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

export const buildSessionStep = (
  overrides: Partial<SessionStep> = {},
): SessionStep => ({
  id: 'step-1',
  session_id: 'session-1',
  name: null,
  content: null,
  default_step_key: null,
  checked: 0,
  collapsed: 0,
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ...overrides,
});
