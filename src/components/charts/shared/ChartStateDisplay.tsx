import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChartStateDisplayProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;

  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;

  height?: number | string;
  className?: string;

  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
}

export const ChartStateDisplay: React.FC<ChartStateDisplayProps> = ({
  isLoading,
  isError,
  isEmpty,
  loadingMessage = 'Loading data...',
  errorMessage = 'Failed to load data',
  emptyMessage = 'No data available.',
  height = 300,
  className,
  onRetry,
  onBack,
  retryLabel = 'Retry',
}) => {
  const containerStyle = typeof height === 'number' ? { height: `${height}px` } : { height };

  if (isLoading) {
    return (
      <div
        className={cn(
          'w-full flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]',
          className
        )}
        style={containerStyle}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {loadingMessage}
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          'w-full flex items-center justify-center rounded-xl border border-red-500/10 bg-red-500/[0.02]',
          className
        )}
        style={containerStyle}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-[13px] font-medium text-red-400">{errorMessage}</span>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2 rounded-lg border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold text-[11px] uppercase tracking-wider"
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'w-full rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center justify-center text-white text-[13px] font-medium uppercase tracking-wider',
          className
        )}
        style={containerStyle}
      >
        <p className="text-white/60">{emptyMessage}</p>
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="mt-4 rounded-lg border-white/[0.08] text-white hover:bg-white/[0.06] font-semibold text-[11px] uppercase tracking-wider"
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  return null;
};
