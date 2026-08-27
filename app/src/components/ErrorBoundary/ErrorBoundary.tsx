import { FunctionComponent, ReactNode } from 'react';
import {
  FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';
import { getErrorDisplayInfo } from '@/util';
import { ErrorFallbackView } from '../ErrorFallbackView/ErrorFallbackView';

const ErrorFallback: FunctionComponent<FallbackProps> = ({
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

type ErrorBoundaryProps = {
  children: ReactNode;
  onReset?: () => void;
};

export const ErrorBoundary = ({ children, onReset }: ErrorBoundaryProps) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={
        onReset ??
        (() => {
          /* noop */
        })
      }
      onError={(error, errorInfo) => {
        // Log to console in development
        if (import.meta.env.DEV) {
          console.error('Error caught by boundary:', error, errorInfo);
        }
        // In production, you could send this to an error tracking service
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
