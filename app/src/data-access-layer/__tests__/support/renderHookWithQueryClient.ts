import { createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { createQueryClient } from '../../queryClient';

export const renderHookWithQueryClient = <Result, Props>(
  render: (props: Props) => Result,
  options?: { initialProps: Props },
) => {
  const queryClient = createQueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return {
    ...renderHook(render, { wrapper, ...options }),
    queryClient,
    invalidateQueries,
  };
};

// Advances Vitest's fake timers inside `act`, because Testing Library's `waitFor` does not re-check a hook test under fake timers.
export const settle = async (ms: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(ms));
};
