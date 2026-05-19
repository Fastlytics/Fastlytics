import React from 'react';
import { m } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { PitStopTeamStat } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';

interface PitStopLeaderboardProps {
  teamStats: PitStopTeamStat[];
  isLoading?: boolean;
  selectedYear: number;
}

const formatSeconds = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  return seconds.toFixed(1);
};

const PitStopLeaderboard: React.FC<PitStopLeaderboardProps> = ({
  teamStats,
  isLoading,
  selectedYear,
}) => {
  const navigate = useNavigate();

  const ranked = React.useMemo(() => {
    return [...(teamStats ?? [])]
      .filter((t) => t.fastestStopSeconds !== null && t.fastestStopSeconds !== undefined)
      .sort((a, b) => (a.fastestStopSeconds ?? Infinity) - (b.fastestStopSeconds ?? Infinity))
      .slice(0, 5);
  }, [teamStats]);

  const overallFastest = ranked[0]?.fastestStopSeconds ?? null;

  if (isLoading) {
    return <div className={`${CARD_CONTAINER} h-[280px] animate-pulse`} />;
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${CARD_CONTAINER} flex h-full flex-col`}
    >
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <span className={CARD_LABEL}>Pit stops</span>
        <button
          onClick={() => navigate('/leaderboard/pitstops')}
          className="text-[12px] font-medium text-white/60 transition-colors hover:text-white"
        >
          See all &rarr;
        </button>
      </div>

      <p className="px-5 pb-2 text-[11px] text-white/80">
        Ranked by fastest stop &middot; stationary time
      </p>

      <div className="flex-1 px-2 pb-3">
        {ranked.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-white/80">
            No pit stops recorded yet this season
          </div>
        ) : (
          ranked.map((team, i) => {
            const isOverallFastest =
              overallFastest !== null && team.fastestStopSeconds === overallFastest;
            const driverImage = team.fastestStopDriver
              ? getDriverImage(team.fastestStopDriver, selectedYear)
              : null;
            return (
              <div
                key={team.team}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="w-4 shrink-0 text-[13px] tabular-nums text-white">{i + 1}</span>
                {driverImage && (
                  <div className="size-9 shrink-0 overflow-hidden rounded-full">
                    <img
                      src={driverImage}
                      alt={team.fastestStopDriver}
                      className="size-full object-cover object-top"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">{team.team}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    {team.fastestStopDriver && team.fastestStopRace ? (
                      <>
                        <span className="truncate">{team.fastestStopRace}</span>
                      </>
                    ) : (
                      <span className="tabular-nums">
                        {team.validStopCount} stop{team.validStopCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={[
                    'shrink-0 text-right text-[14px] tabular-nums',
                    isOverallFastest ? 'text-emerald-400' : 'text-white',
                  ].join(' ')}
                >
                  {formatSeconds(team.fastestStopSeconds)}
                  <span className="ml-1 text-[11px] font-normal text-white/80">s</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </m.div>
  );
};

export default PitStopLeaderboard;
