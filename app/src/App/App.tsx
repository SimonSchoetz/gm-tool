import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppContent } from './components/AppContent/AppContent';

export const App = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);
