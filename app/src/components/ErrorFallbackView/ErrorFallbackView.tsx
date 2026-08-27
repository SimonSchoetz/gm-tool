import { FCProps } from '@/types';
import './ErrorFallbackView.css';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { Button } from '../Button/Button';

type Props = {
  errorMessage: string;
  errorStack: string | null;
  onReset: () => void;
};

export const ErrorFallbackView: FCProps<Props> = ({
  errorMessage,
  errorStack,
  onReset,
}) => {
  const isDevelopment = import.meta.env.DEV;

  return (
    <GlassPanel className='error-fallback-view-panel' intensity='bright'>
      <h1 className='error-fallback-view-title'>Something went wrong</h1>

      <p className='error-fallback-view-message'>{errorMessage}</p>

      {isDevelopment && errorStack && (
        <details className='error-fallback-view-details'>
          <summary>Stack trace</summary>
          <pre className='error-fallback-view-stack'>{errorStack}</pre>
        </details>
      )}

      <div className='error-fallback-view-actions'>
        <Button label='Try again' onClick={onReset} />
        <Button label='Go home' onClick={() => (window.location.href = '/')} />
      </div>
    </GlassPanel>
  );
};
