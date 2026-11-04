import { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { FCProps } from '@/types/fcProps.type';
import { ErrorFallback } from './components/ErrorFallback/ErrorFallback';

type Props = {
  children: ReactNode;
};

export const ErrorBoundary: FCProps<Props> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
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
