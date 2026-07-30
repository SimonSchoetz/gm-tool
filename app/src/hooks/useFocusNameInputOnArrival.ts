import { useRouterState } from '@tanstack/react-router';

export const useFocusNameInputOnArrival = (): boolean =>
  useRouterState({
    select: (state) => state.location.state.focusNameInput ?? false,
  });
