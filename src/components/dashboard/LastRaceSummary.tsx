import React from 'react';
import { m } from 'motion/react';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { getDriverImage } from '@/utils/imageMapping';
import { useSeason } from '@/contexts/SeasonContext';

export interface PodiumDriverDetailed {
  position: 1 | 2 | 3;
  driver: string;
  driverCode?: string;
  team: string;
  teamColor: string;
  gapToWinner?: string;
  gridPosition?: number;
  finalPosition: number;
}

interface LastRaceSummaryProps {
  raceName: string;
  roundNumber: number;
  countryCode?: string;
  date: string;
  podium: PodiumDriverDetailed[];
  pole?: { driver: string; lapTime: string };
  fastestLap?: { driver: string; lapTime: string };
  biggestGainer?: { driver: string; gridPos: number; finalPos: number };
  dnfCount?: number;
  isLoading?: boolean;
  onClick?: () => void;
}

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
};

const normalizeTeamColor = (color: string): string => {
  if (!color) return '#6b7280';
  return color.startsWith('#') ? color : `#${color}`;
};

/** Extract last name from full name for compact display */
const lastName = (fullName: string): string => {
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

const LastRaceSummary: React.FC<LastRaceSummaryProps> = ({
  raceName,
  roundNumber,
  countryCode,
  date,
  podium,
  pole,
  fastestLap,
  biggestGainer,
  dnfCount,
  isLoading,
  onClick,
}) => {
  const { selectedYear } = useSeason();
  if (isLoading) {
    return <div className={`${CARD_CONTAINER} h-full animate-pulse`} />;
  }

  if (!raceName || !podium || podium.length === 0) {
    return (
      <div className={`${CARD_CONTAINER} h-full p-5`}>
        <span className={CARD_LABEL}>Last race</span>
        <p className="mt-2 text-[13px] text-white/80">No completed races yet this season.</p>
      </div>
    );
  }

  const topThree = [...podium].sort((a, b) => a.position - b.position).slice(0, 3);
  const winner = topThree[0];
  const roundLabel = roundNumber ? `R${String(roundNumber).padStart(2, '0')}` : '';

  const gainerDelta = biggestGainer != null ? biggestGainer.gridPos - biggestGainer.finalPos : 0;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${CARD_CONTAINER} h-full`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col text-left transition-opacity hover:opacity-90"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <span className={CARD_LABEL}>Last race</span>
          {roundLabel && (
            <>
              <span className="text-white/30">·</span>
              <span className="font text-[11px] tabular-nums text-white/60">{roundLabel}</span>
            </>
          )}
          <span className="text-white/30">·</span>
          <span className="font text-[11px] tabular-nums text-white/60">{formatDate(date)}</span>
        </div>

        {/* Race name row */}
        <div className="flex items-center gap-2.5 px-5 pb-4">
          {countryCode && countryCode !== 'xx' && (
            <img
              src={`https://flagcdn.com/${countryCode}.svg`}
              alt=""
              className="h-6 w-auto shrink-0 rounded-[2px] border border-white/[0.06]"
            />
          )}
          <span className="truncate text-[15px] font-medium text-white">{raceName}</span>
        </div>

        {/* Winner highlight */}
        <div className="mx-5 mb-3 flex items-center gap-3 rounded-md border border-white/[0.04] px-3 py-2.5">
          <span
            aria-hidden="true"
            className="h-8 w-0.5 shrink-0 rounded-full"
            style={{ backgroundColor: normalizeTeamColor(winner.teamColor) }}
          />
          {winner.driverCode && getDriverImage(winner.driverCode, selectedYear) && (
            <img
              src={getDriverImage(winner.driverCode, selectedYear)}
              alt={winner.driver}
              className="h-14 w-14 shrink-0 rounded-full object-cover object-top border border-white/[0.08]"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium text-white">{winner.driver}</div>
            <div className="text-[12px] text-white/60">{winner.team}</div>
          </div>
          <span className="shrink-0 font text-[12px] tabular-nums text-amber-400">P1</span>
        </div>

        {/* Pole position — compact inline */}
        {pole && (
          <div className="mx-5 mb-3 flex items-baseline gap-2 rounded-md bg-white/[0.02] px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Pole
            </span>
            <span className="truncate text-[13px] text-white/80">{pole.driver}</span>
            <span className="ml-auto shrink-0 font text-[11px] tabular-nums text-white/50">
              {pole.lapTime}
            </span>
          </div>
        )}

        {/* P2 & P3 compact */}
        <div className="mx-5 mb-4 flex gap-3">
          {topThree.slice(1).map((entry) => (
            <div
              key={entry.position}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5"
            >
              <span
                aria-hidden="true"
                className="h-5 w-0.5 shrink-0 rounded-full opacity-60"
                style={{ backgroundColor: normalizeTeamColor(entry.teamColor) }}
              />
              {entry.driverCode && getDriverImage(entry.driverCode, selectedYear) && (
                <img
                  src={getDriverImage(entry.driverCode, selectedYear)}
                  alt={entry.driver}
                  className="h-10 w-10 shrink-0 rounded-full object-cover object-top border border-white/[0.08]"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-white/90">{lastName(entry.driver)}</div>
                {entry.gapToWinner && (
                  <div className="font text-[11px] tabular-nums text-white/50">
                    {entry.gapToWinner}
                  </div>
                )}
              </div>
              <span className="shrink-0 font text-[11px] tabular-nums text-white/50">
                P{entry.position}
              </span>
            </div>
          ))}
        </div>

        {/* Stats row — compact inline */}
        <div className="mt-auto border-t border-white/[0.04] px-5 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {fastestLap && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/50">FL</span>
                <span className="truncate text-[12px] text-white/80">
                  {lastName(fastestLap.driver)}
                </span>
                <span className="font text-[11px] tabular-nums text-emerald-400">
                  {fastestLap.lapTime}
                </span>
              </div>
            )}
            {biggestGainer && gainerDelta >= 3 && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/50">↑</span>
                <span className="truncate text-[12px] text-white/80">
                  {lastName(biggestGainer.driver)}
                </span>
                <span className="font text-[11px] tabular-nums text-emerald-400">
                  +{gainerDelta}
                </span>
              </div>
            )}
            {typeof dnfCount === 'number' && dnfCount > 0 && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-white/50">DNF</span>
                <span className="font text-[11px] tabular-nums text-red-400">{dnfCount}</span>
              </div>
            )}
          </div>
        </div>
      </button>
    </m.div>
  );
};

export default LastRaceSummary;
