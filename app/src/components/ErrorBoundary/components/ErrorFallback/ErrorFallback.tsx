import type { FunctionComponent } from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { getErrorDisplayInfo } from '@/util/getErrorDisplayInfo';
import { ErrorFallbackView } from '../../../ErrorFallbackView/ErrorFallbackView';

export const ErrorFallback: FunctionComponent<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const { message, stack } = getErrorDisplayInfo(error);

  return (
    <ErrorFallbackView
      errorMessage={message}
      errorStack={stack}
      onReset={resetErrorBoundary}
    />
  );
};
