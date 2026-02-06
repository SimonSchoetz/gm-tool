import { FunctionComponent, ReactNode } from 'react';
import {
  FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';
import GlassPanel from '../GlassPanel/GlassPanel';
import { Button } from '../Button/Button';
import { cn } from '@/util';
import './ErrorBoundary.css';

const ErrorFallback: FunctionComponent<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const isDevelopment = import.meta.env.DEV;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <GlassPanel className={cn('error-boundary-panel')} intensity='bright'>
      <h1 className='error-boundary-title'>Something went wrong</h1>

      <p className='error-boundary-message'>{errorMessage}</p>

      {isDevelopment && errorStack && (
        <details className='error-boundary-details'>
          <summary>Stack trace</summary>
          <pre className='error-boundary-stack'>{errorStack}</pre>
        </details>
      )}

      <div className='error-boundary-actions'>
        <Button label='Try again' onClick={resetErrorBoundary} />
        <Button label='Go home' onClick={() => (window.location.href = '/')} />
      </div>
    </GlassPanel>
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
      onReset={onReset}
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
