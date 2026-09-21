import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithQueryClient } from './support/renderHookWithQueryClient';
import { useDuplicateMutation } from '../useDuplicateMutation';

const LIST_KEY = ['sessions', 'adventure-1'] as const;
const duplicateFn = vi.fn(() => Promise.resolve('new-id'));

describe('useDuplicateMutation', () => {
  beforeEach(() => {
    duplicateFn.mockClear();
  });

  it('invalidates only the list key it was given', async () => {
    const { result, invalidateQueries } = renderHookWithQueryClient(() =>
      useDuplicateMutation(duplicateFn, LIST_KEY),
    );

    await act(() => result.current());

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: LIST_KEY });
  });

  it('resolves to the id the duplicate produced', async () => {
    const { result } = renderHookWithQueryClient(() =>
      useDuplicateMutation(duplicateFn, LIST_KEY),
    );

    const newId = await act(() => result.current());

    expect(newId).toBe('new-id');
    expect(duplicateFn).toHaveBeenCalledTimes(1);
  });
});
