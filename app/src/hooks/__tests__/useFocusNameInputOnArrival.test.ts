import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRouterState } from '@tanstack/react-router';
import { useFocusNameInputOnArrival } from '../useFocusNameInputOnArrival';

vi.mock('@tanstack/react-router', () => ({ useRouterState: vi.fn() }));

const arriveWithHistoryState = (state: { focusNameInput?: boolean }) => {
  vi.mocked(useRouterState).mockImplementation(((options: {
    select: (routerState: { location: { state: unknown } }) => unknown;
  }) => options.select({ location: { state } })) as never);
  return renderHook(() => useFocusNameInputOnArrival()).result.current;
};

describe('useFocusNameInputOnArrival', () => {
  it('is true when the arrival asked for the name input to be focused', () => {
    expect(arriveWithHistoryState({ focusNameInput: true })).toBe(true);
  });

  it('is false when the arrival did not set the flag', () => {
    expect(arriveWithHistoryState({})).toBe(false);
  });

  it('is false when the arrival explicitly cleared the flag', () => {
    expect(arriveWithHistoryState({ focusNameInput: false })).toBe(false);
  });
});
