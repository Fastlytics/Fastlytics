import { ErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

const ErrorFallback = ({
  error: _error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-md text-white/70">An unexpected error occurred. Please try again.</p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
      >
        Try again
      </button>
    </div>
  );
};

const logError = (error: Error, info: { componentStack?: string | null }) => {
  logger.error('React render error:', error, info);
  Sentry.captureException(error, { extra: info as Record<string, unknown> });
};

export const AppErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
    {children}
  </ErrorBoundary>
);
