import React from 'react';
import { m } from 'motion/react';
import { CrownIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface PodiumCardProps {
  position: 1 | 2 | 3;
  colorClass: string;
  points: number;
  wins: number;
  podiums: number;
  leaderLabel?: string;
  delay?: number;
  transparent?: boolean;
  children: React.ReactNode;
}

const positionConfig = {
  1: {
    delay: 0,
    order: 'order-1 md:order-2',
    translateY: 'md:-translate-y-4',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    shadow: 'shadow-[0_0_60px_rgba(245,158,11,0.06)]',
    ptsColor: 'text-amber-400',
    statBorder: 'border-amber-500/10',
    statBg: 'bg-amber-500/[0.04]',
    statLabelColor: 'text-amber-400/60',
    nameSize: 'text-[22px]',
    ptsSize: 'text-4xl',
    statSize: 'text-[20px]',
    badgeBorder: 'border-amber-500/20',
    badgeBg: 'bg-amber-500/[0.07]',
    badgeText: 'text-amber-400',
  },
  2: {
    delay: 0.15,
    order: 'order-2 md:order-1',
    translateY: '',
    border: 'border-white/[0.06] hover:border-white/[0.1]',
    shadow: '',
    ptsColor: 'text-white',
    statBorder: 'border-white/[0.04]',
    statBg: 'bg-white/[0.02]',
    statLabelColor: 'text-white/30',
    nameSize: 'text-[18px]',
    ptsSize: 'text-3xl',
    statSize: 'text-[16px]',
    badgeBorder: '',
    badgeBg: '',
    badgeText: '',
  },
  3: {
    delay: 0.3,
    order: 'order-3',
    translateY: '',
    border: 'border-white/[0.06] hover:border-white/[0.1]',
    shadow: '',
    ptsColor: 'text-white',
    statBorder: 'border-white/[0.04]',
    statBg: 'bg-white/[0.02]',
    statLabelColor: 'text-white/30',
    nameSize: 'text-[18px]',
    ptsSize: 'text-3xl',
    statSize: 'text-[16px]',
    badgeBorder: '',
    badgeBg: '',
    badgeText: '',
  },
};

export const PodiumCard: React.FC<PodiumCardProps> = ({
  position,
  colorClass,
  points,
  wins,
  podiums,
  leaderLabel,
  delay,
  transparent,
  children,
}) => {
  const cfg = positionConfig[position];
  const isP1 = position === 1;

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? cfg.delay, duration: 0.5 }}
      className={cfg.order}
    >
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl transition-colors',
          !transparent && 'bg-[#0c0c0e]',
          cfg.border,
          cfg.shadow,
          'border'
        )}
      >
        <div className={cn('absolute left-0 top-0 h-0.5 w-full', `bg-f1-${colorClass}`)} />

        {isP1 && (
          <>
            <div className="absolute -right-3 -top-3 text-amber-500/10">
              <CrownIcon className="size-28" />
            </div>
          </>
        )}

        <div
          className={cn(
            'relative z-10 flex flex-col items-center',
            isP1 ? 'p-8 pt-12' : 'p-6 pt-10'
          )}
        >
          {isP1 && leaderLabel && (
            <div className="mb-4">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-bold',
                  cfg.badgeBorder,
                  cfg.badgeBg,
                  cfg.badgeText
                )}
              >
                {leaderLabel}
              </span>
            </div>
          )}

          {!isP1 && (
            <div className="absolute right-4 top-4 text-5xl font-bold tabular-nums text-white/[0.06]">
              {position}
            </div>
          )}

          {children}

          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={cn('font-bold tabular-nums', cfg.ptsColor, cfg.ptsSize)}>
              {points}
            </span>
            <span className="text-[12px] text-white/40">PTS</span>
          </div>

          <div className={cn('grid w-full grid-cols-2 gap-3', isP1 ? 'mt-5' : 'mt-4')}>
            <div
              className={cn(
                'rounded-lg border p-3 text-center',
                cfg.statBorder,
                !transparent && cfg.statBg,
                !isP1 && 'p-2.5'
              )}
            >
              <div className={cn('font-bold tabular-nums text-white', cfg.statSize)}>{wins}</div>
              <div
                className={cn(
                  'text-[10px] font-medium uppercase tracking-wider',
                  cfg.statLabelColor
                )}
              >
                Wins
              </div>
            </div>
            <div
              className={cn(
                'rounded-lg border p-3 text-center',
                cfg.statBorder,
                !transparent && cfg.statBg,
                !isP1 && 'p-2.5'
              )}
            >
              <div className={cn('font-bold tabular-nums text-white', cfg.statSize)}>{podiums}</div>
              <div
                className={cn(
                  'text-[10px] font-medium uppercase tracking-wider',
                  cfg.statLabelColor
                )}
              >
                Podiums
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
};
