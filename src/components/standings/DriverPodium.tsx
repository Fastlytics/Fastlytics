import React from 'react';
import { m } from 'motion/react';
import { CrownIcon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

interface PodiumDriver {
  position: 1 | 2 | 3;
  name: string;
  team: string;
  code: string;
  points: number;
  wins: number;
  podiums: number;
  image: string;
  colorClass: string;
}

interface DriverPodiumProps {
  drivers: PodiumDriver[];
  leaderLabel?: string;
}

const config = {
  1: {
    delay: 0,
    order: 'order-2',
    translateY: 'md:-translate-y-5',
    imageH: 'h-56',
    imageW: 'w-40',
    border: 'border-amber-500/20',
    shadow: 'shadow-[0_0_60px_rgba(245,158,11,0.06)]',
    ptsColor: 'text-amber-400',
    nameSize: 'text-xl',
    ptsSize: 'text-4xl',
    statSize: 'text-lg',
    statBorder: 'border-amber-500/10',
    statBg: 'bg-amber-500/[0.04]',
    statLabel: 'text-amber-400/60',
    badgeBorder: 'border-amber-500/20',
    badgeBg: 'bg-amber-500/[0.07]',
    badgeText: 'text-amber-400',
    rankOpacity: 'text-white/[0.06]',
  },
  2: {
    delay: 0.12,
    order: 'order-1',
    translateY: '',
    imageH: 'h-48',
    imageW: 'w-36',
    border: 'border-white/[0.06]',
    shadow: '',
    ptsColor: 'text-white',
    nameSize: 'text-lg',
    ptsSize: 'text-3xl',
    statSize: 'text-base',
    statBorder: 'border-white/[0.04]',
    statBg: 'bg-white/[0.02]',
    statLabel: 'text-white/30',
    badgeBorder: '',
    badgeBg: '',
    badgeText: '',
    rankOpacity: 'text-white/[0.04]',
  },
  3: {
    delay: 0.24,
    order: 'order-3',
    translateY: '',
    imageH: 'h-48',
    imageW: 'w-36',
    border: 'border-white/[0.06]',
    shadow: '',
    ptsColor: 'text-white',
    nameSize: 'text-lg',
    ptsSize: 'text-3xl',
    statSize: 'text-base',
    statBorder: 'border-white/[0.04]',
    statBg: 'bg-white/[0.02]',
    statLabel: 'text-white/30',
    badgeBorder: '',
    badgeBg: '',
    badgeText: '',
    rankOpacity: 'text-white/[0.04]',
  },
};

export const DriverPodium: React.FC<DriverPodiumProps> = ({ drivers, leaderLabel }) => {
  return (
    <div className="mb-10 grid grid-cols-3 items-end gap-3 md:gap-6">
      {drivers.map((driver) => {
        const cfg = config[driver.position];
        const isP1 = driver.position === 1;

        return (
          <m.div
            key={driver.code}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cfg.delay, duration: 0.25 }}
            className={cn('flex flex-col items-center', cfg.order, cfg.translateY)}
          >
            {/* Image — no visible container, just a clip mask */}
            <div className={cn('relative overflow-hidden', cfg.imageH, cfg.imageW)}>
              <img
                src={driver.image}
                alt={driver.name}
                className="size-full object-cover object-top"
                loading="eager"
              />
            </div>

            {/* Info card */}
            <div
              className={cn(
                'relative mt-1 w-full overflow-hidden rounded-xl border bg-[#0c0c0e] text-center',
                cfg.border,
                cfg.shadow,
                isP1 ? 'p-5 pt-5' : 'p-4 pt-4'
              )}
            >
              {/* Team color accent line */}
              <div
                className={cn('absolute left-0 top-0 h-0.5 w-full', `bg-f1-${driver.colorClass}`)}
              />

              {/* P1 crown */}
              {isP1 && (
                <div className="absolute -right-2 -top-2 text-amber-500/10">
                  <CrownIcon className="size-24" />
                </div>
              )}

              {/* Rank watermark */}
              {!isP1 && (
                <div
                  className={cn(
                    'absolute right-3 top-2 text-5xl font-bold tabular-nums',
                    cfg.rankOpacity
                  )}
                >
                  {driver.position}
                </div>
              )}

              {/* Leader badge */}
              {isP1 && leaderLabel && (
                <div className="mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                      cfg.badgeBorder,
                      cfg.badgeBg,
                      cfg.badgeText
                    )}
                  >
                    {leaderLabel}
                  </span>
                </div>
              )}

              {/* Team */}
              <div className="text-[11px] font-medium tracking-wider text-white/40">
                {driver.team}
              </div>

              {/* Name */}
              <div className={cn('mt-0.5 font-bold text-white', cfg.nameSize)}>{driver.name}</div>

              {/* Points */}
              <div className="mt-2 flex items-baseline justify-center gap-1.5">
                <span className={cn('font-bold tabular-nums', cfg.ptsColor, cfg.ptsSize)}>
                  {driver.points}
                </span>
                <span className="text-[11px] text-white/40">PTS</span>
              </div>

              {/* Stats */}
              <div className={cn('grid grid-cols-2 gap-2', isP1 ? 'mt-4' : 'mt-3')}>
                <div
                  className={cn('rounded-lg border p-2.5 text-center', cfg.statBorder, cfg.statBg)}
                >
                  <div className={cn('font-bold tabular-nums text-white', cfg.statSize)}>
                    {driver.wins}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-medium uppercase tracking-wider',
                      cfg.statLabel
                    )}
                  >
                    Wins
                  </div>
                </div>
                <div
                  className={cn('rounded-lg border p-2.5 text-center', cfg.statBorder, cfg.statBg)}
                >
                  <div className={cn('font-bold tabular-nums text-white', cfg.statSize)}>
                    {driver.podiums}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-medium uppercase tracking-wider',
                      cfg.statLabel
                    )}
                  >
                    Podiums
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        );
      })}
    </div>
  );
};
