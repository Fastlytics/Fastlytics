import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Timer, Flag } from 'lucide-react';

interface QualifyingCountdownProps {
  remaining: number;
  isRed: boolean;
  formatted: string;
  sessionName: string;
  className?: string;
}

const QualifyingCountdown: React.FC<QualifyingCountdownProps> = ({
  remaining,
  isRed,
  formatted,
  sessionName,
  className,
}) => {
  const phase = useMemo(() => {
    const s = sessionName.toUpperCase();
    if (s.includes('Q1') || s.includes('SQ1')) return 'Q1';
    if (s.includes('Q2') || s.includes('SQ2')) return 'Q2';
    if (s.includes('Q3') || s.includes('SQ3')) return 'Q3';
    return 'Q';
  }, [sessionName]);

  const isFinished = remaining === 0;

  return (
    <div
      className={cn(
        'absolute top-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-2.5 rounded-lg border backdrop-blur',
          'bg-[#0c0c0e]/90',
          isFinished ? 'border-white/[0.06]' : isRed ? 'border-red-500/20' : 'border-white/[0.06]'
        )}
      >
        {isFinished ? (
          <Flag size={14} className="text-white" />
        ) : (
          <Timer
            size={14}
            className={cn('tabular-nums', isRed ? 'text-red-400 animate-pulse' : 'text-white')}
          />
        )}

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-normal uppercase tracking-wider text-white">
            {phase}
          </span>
          <span className="h-3 w-px bg-white/[0.08]" />
          <span
            className={cn(
              'text-[18px] font-bold tabular-nums tracking-tight',
              isFinished
                ? 'text-white font-normal'
                : isRed
                  ? 'text-red-400 animate-pulse'
                  : 'text-white'
            )}
          >
            {isFinished ? 'FINISHED' : formatted}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QualifyingCountdown;
