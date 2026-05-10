import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChartLoadPromptProps {
  message: string;
  buttonLabel?: string;
  disabled?: boolean;
  onLoad: () => void;
  className?: string;
  height?: number | string;
}

export const ChartLoadPrompt: React.FC<ChartLoadPromptProps> = ({
  message,
  buttonLabel = 'Load Data',
  disabled = false,
  onLoad,
  className,
  height = 300,
}) => {
  const style = typeof height === 'number' ? { height: `${height}px` } : { height };

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] gap-4',
        className
      )}
      style={style}
    >
      <p className="text-white text-[13px] font-medium uppercase tracking-wider">{message}</p>
      <Button
        onClick={onLoad}
        className="rounded-lg bg-white hover:bg-white/90 text-black font-semibold text-[12px] uppercase tracking-wider"
        disabled={disabled}
      >
        {buttonLabel}
      </Button>
    </div>
  );
};
