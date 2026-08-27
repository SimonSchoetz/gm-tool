import { FunctionComponent } from 'react';
import { ErrorComponentProps } from '@tanstack/react-router';
import { getErrorDisplayInfo } from '@/util';
import { ErrorFallbackView } from '../ErrorFallbackView/ErrorFallbackView';

export const RouteErrorFallback: FunctionComponent<ErrorComponentProps> = ({
  error,
  reset,
}) => {
  const { message, stack } = getErrorDisplayInfo(error);

  return (
    <ErrorFallbackView
      errorMessage={message}
      errorStack={stack}
      onReset={reset}
    />
  );
};
