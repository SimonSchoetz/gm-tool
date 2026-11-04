import { QueryClient } from '@tanstack/react-query';

// eslint-disable-next-line local/no-unused-exports -- tests build a fresh client with the app's defaults per test
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      mutations: {
        throwOnError: true, // Errors bubble to Error Boundary
      },
    },
  });

export const queryClient = createQueryClient();
