import React from 'react';
import { m } from 'motion/react';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { getDriverImage } from '@/utils/imageMapping';

type StatTone = 'default' | 'amber' | 'emerald' | 'red' | 'sky';

interface SeasonStat {
  label: string;
  value: string;
  unit?: string;
  context?: string;
  driverCode?: string;
  tone?: StatTone;
}

interface SeasonStatsProps {
  stats: SeasonStat[];
  year: number;
  isLoading?: boolean;
}

const TONE_CLASS: Record<StatTone, string> = {
  default: 'text-white',
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  red: 'text-red-400',
  sky: 'text-sky-400',
};

const SeasonStats: React.FC<SeasonStatsProps> = ({ stats, year, isLoading }) => {
  if (isLoading) {
    return <div className={`${CARD_CONTAINER} h-[420px] animate-pulse`} />;
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${CARD_CONTAINER} flex h-full flex-col`}
    >
      <div className="px-5 pt-5 pb-3">
        <span className={CARD_LABEL}>Season stats</span>
      </div>

      <div className="grid flex-1 grid-cols-2 divide-x divide-y divide-white/[0.04] border-t border-white/[0.04] md:grid-cols-3">
        {stats.length === 0 ? (
          <div className="col-span-full px-5 py-8 text-center text-[13px] text-white/80">
            No season stats available
          </div>
        ) : (
          stats.map((stat) => {
            const toneClass = TONE_CLASS[stat.tone ?? 'default'];
            const driverImg = stat.driverCode ? getDriverImage(stat.driverCode, year) : '';

            return (
              <div key={stat.label} className="flex items-start gap-3 px-5 py-4">
                {driverImg && (
                  <img
                    src={driverImg}
                    alt={stat.context ?? stat.driverCode ?? ''}
                    className="mt-1 h-16 w-16 shrink-0 rounded-full object-cover object-top ring-1 ring-white/10"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className={CARD_LABEL}>{stat.label}</div>
                  <div
                    className={[
                      'mt-1.5 font text-[18px] font-semibold leading-none tabular-nums',
                      toneClass,
                    ].join(' ')}
                  >
                    {stat.value}
                    {stat.unit && (
                      <span className="ml-1 text-[11px] font-normal text-white/80">
                        {stat.unit}
                      </span>
                    )}
                  </div>
                  {stat.context && (
                    <div className="mt-1.5 truncate text-[11px] text-white/80">{stat.context}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </m.div>
  );
};

export default SeasonStats;
