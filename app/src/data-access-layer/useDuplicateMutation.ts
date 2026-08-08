import { useMutation, useQueryClient } from '@tanstack/react-query';

// A duplicate mutation invalidates only the list query key — the new entity has no cached detail entry yet, so the destination screen's own useQuery fetches it fresh on mount. See app/src/CLAUDE.md — State Management & Error Handling.
export const useDuplicateMutation = (
  duplicateFn: () => Promise<string>,
  listQueryKey: readonly unknown[],
): (() => Promise<string>) => {
  const queryClient = useQueryClient();

  const duplicateMutation = useMutation({
    mutationFn: duplicateFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

  return async (): Promise<string> => duplicateMutation.mutateAsync();
};
