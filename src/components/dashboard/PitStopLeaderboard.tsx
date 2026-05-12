import React from 'react';
import { m } from 'motion/react';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

interface PitStopTeamStat {
  team: string;
  teamColor: string;
  fastestStopSeconds: number | null;
  averageStopSeconds: number | null;
  validStopCount: number;
  fastestStopDriver?: string;
  fastestStopRace?: string;
}

interface PitStopLeaderboardProps {
  teamStats: PitStopTeamStat[];
  isLoading?: boolean;
}

const normalizeTeamColor = (color: string): string => {
  if (!color) return '#6b7280';
  return color.startsWith('#') ? color : `#${color}`;
};

const formatSeconds = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  return seconds.toFixed(2);
};

const PitStopLeaderboard: React.FC<PitStopLeaderboardProps> = ({ teamStats, isLoading }) => {
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
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <span className={CARD_LABEL}>Pit stops</span>
        <span
          className="flex size-4 cursor-help items-center justify-center rounded-full border border-white/[0.06] text-[10px] font-medium text-white/80"
          title="Stationary pit stop time from OpenF1 (available from 2024 US GP onwards)"
        >
          ?
        </span>
      </div>

      <p className="px-5 pb-2 text-[11px] text-white/80">
        Ranked by fastest stop · stationary time
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
            return (
              <div
                key={team.team}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="w-4 shrink-0 font-mono text-[13px] tabular-nums text-white">
                  {i + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="h-6 w-0.5 shrink-0 rounded-full"
                  style={{ backgroundColor: normalizeTeamColor(team.teamColor) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">{team.team}</div>
                  <div className="text-[11px] text-white/80">
                    {team.fastestStopDriver && team.fastestStopRace ? (
                      <span>
                        <span className="font-mono tabular-nums">{team.fastestStopDriver}</span>
                        {' · '}
                        {team.fastestStopRace}
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums">
                        {team.validStopCount} stop{team.validStopCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={[
                      'font-mono text-[14px] tabular-nums',
                      isOverallFastest ? 'text-emerald-400' : 'text-white',
                    ].join(' ')}
                  >
                    {formatSeconds(team.fastestStopSeconds)}
                    <span className="ml-1 text-[11px] font-normal text-white/80">s</span>
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-white/80">
                    avg {formatSeconds(team.averageStopSeconds)}s
                  </div>
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
