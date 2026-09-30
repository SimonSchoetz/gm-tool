import { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './components/ErrorFallback/ErrorFallback';

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
