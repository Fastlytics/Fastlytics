import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { EraRankingsProps, NormalizedStats } from '@/lib/types/career-analytics';
import type { DriverCareer, TeamCareer, DriverSeason, TeamSeason } from '@/lib/api';
import { useEraMetadata } from '@/hooks/useCareerAnalytics';
import { computeNormalizedStats, rankDrivers } from '@/lib/career-analytics/era-normalizer';
import { ALL_TIME_GREATS } from '@/lib/career-analytics/constants';

type ViewMode = 'stats' | 'ranking';

interface SeasonData {
  season: number;
  wins: number;
  podiums: number;
  points: number;
  races: number;
  position?: number | null;
}

function extractSeasons(career: unknown, entityType: 'driver' | 'team'): SeasonData[] {
  if (entityType === 'driver') {
    const driverCareer = career as DriverCareer;
    return (driverCareer.seasons || []).map((s: DriverSeason) => ({
      season: s.season,
      wins: s.wins,
      podiums: s.podiums,
      points: s.points,
      races: s.races,
      position: s.position,
    }));
  }
  const teamCareer = career as TeamCareer;
  return (teamCareer.seasons || []).map((s: TeamSeason) => ({
    season: s.season,
    wins: s.wins,
    podiums: s.podiums,
    points: s.points,
    races: s.races,
    position: s.position,
  }));
}

function getEntityName(career: unknown, entityType: 'driver' | 'team'): string {
  if (entityType === 'driver') {
    return (career as DriverCareer).name || 'Unknown';
  }
  return (career as TeamCareer).name || 'Unknown';
}

function getRawTotals(seasons: SeasonData[]) {
  let wins = 0;
  let podiums = 0;
  let points = 0;
  let races = 0;
  for (const s of seasons) {
    wins += s.wins;
    podiums += s.podiums;
    points += s.points;
    races += s.races;
  }
  return { wins, podiums, points, races };
}

function StatCard({
  label,
  rawValue,
  normalizedValue,
  normalizedLabel,
}: {
  label: string;
  rawValue: string | number;
  normalizedValue?: string | number;
  normalizedLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">{label}</p>
      <div className="flex items-end gap-3">
        <div>
          <p className="text-[11px] text-white/30">Raw</p>
          <p className="text-2xl font-bold tabular-nums text-white">{rawValue}</p>
        </div>
        {normalizedValue !== undefined && (
          <div className="border-l border-white/[0.06] pl-3">
            <p className="text-[11px] text-white/30">{normalizedLabel || 'Normalized'}</p>
            <p className="text-2xl font-bold tabular-nums text-red-400">{normalizedValue}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RankingRow({
  rank,
  name,
  score,
  isHighlighted,
}: {
  rank: number;
  name: string;
  score: number;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2',
        isHighlighted
          ? 'border border-red-500/30 bg-red-500/[0.08]'
          : 'border border-transparent bg-white/[0.02]'
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
          rank <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.06] text-white/40'
        )}
      >
        {rank}
      </span>
      <span
        className={cn(
          'flex-1 text-[13px] font-medium',
          isHighlighted ? 'text-white' : 'text-white/70'
        )}
      >
        {name}
      </span>
      <span className="text-[13px] font-mono tabular-nums text-white/40">{score.toFixed(2)}</span>
    </div>
  );
}

export default function EraRankings({ career, entityType = 'driver' }: EraRankingsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('stats');
  const { data: eraMetadata, isLoading, isError } = useEraMetadata();

  const seasons = useMemo(() => {
    if (!career) return [];
    return extractSeasons(career, entityType);
  }, [career, entityType]);
  const entityName = useMemo(() => {
    if (!career) return 'Unknown';
    return getEntityName(career, entityType);
  }, [career, entityType]);
  const rawTotals = useMemo(() => getRawTotals(seasons), [seasons]);

  const normalizedStats: NormalizedStats | null = useMemo(() => {
    if (!eraMetadata || eraMetadata.length === 0) return null;
    return computeNormalizedStats(seasons, eraMetadata);
  }, [seasons, eraMetadata]);

  const rankings = useMemo(() => {
    if (!eraMetadata || eraMetadata.length === 0 || !normalizedStats) return null;

    const currentDriverEntry = {
      slug:
        entityType === 'driver'
          ? (career as DriverCareer).driverId
          : (career as TeamCareer).constructorId,
      stats: normalizedStats,
    };

    const allEntries = [currentDriverEntry];
    const ranked = rankDrivers(allEntries);
    return ranked;
  }, [eraMetadata, normalizedStats, career, entityType]);

  const eraUnavailable = isError || (!isLoading && (!eraMetadata || eraMetadata.length === 0));

  if (seasons.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8 text-center">
        <p className="text-[14px] text-white/40">
          No career data available for era-adjusted rankings.
        </p>
        <p className="text-[11px] text-white/25">Season data required for analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 w-fit">
        <button
          onClick={() => setViewMode('stats')}
          className={cn(
            'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
            viewMode === 'stats'
              ? 'bg-white/[0.08] text-white'
              : 'text-white/35 hover:text-white/60'
          )}
        >
          Statistics
        </button>
        <button
          onClick={() => setViewMode('ranking')}
          className={cn(
            'rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
            viewMode === 'ranking'
              ? 'bg-white/[0.08] text-white'
              : 'text-white/35 hover:text-white/60'
          )}
        >
          All-Time Ranking
        </button>
      </div>

      {/* Era metadata unavailable notice */}
      {eraUnavailable && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04] px-5 py-4">
          <p className="text-[12px] text-yellow-400/80">
            Era metadata is temporarily unavailable. Showing raw statistics only. Normalized
            comparisons will appear once the data is restored.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
            />
          ))}
        </div>
      )}

      {/* Stats view */}
      {viewMode === 'stats' && !isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Wins"
              rawValue={rawTotals.wins}
              normalizedValue={
                normalizedStats && !eraUnavailable
                  ? `${normalizedStats.normalized.winPct.toFixed(1)}%`
                  : undefined
              }
              normalizedLabel="Win %"
            />
            <StatCard
              label="Podiums"
              rawValue={rawTotals.podiums}
              normalizedValue={
                normalizedStats && !eraUnavailable
                  ? `${normalizedStats.normalized.podiumPct.toFixed(1)}%`
                  : undefined
              }
              normalizedLabel="Podium %"
            />
            <StatCard
              label="Points"
              rawValue={rawTotals.points.toLocaleString()}
              normalizedValue={
                normalizedStats && !eraUnavailable
                  ? `${normalizedStats.normalized.pointsPct.toFixed(1)}%`
                  : undefined
              }
              normalizedLabel="Points %"
            />
            <StatCard label="Races" rawValue={rawTotals.races} />
            {normalizedStats && !eraUnavailable && (
              <StatCard
                label="Composite Score"
                rawValue="—"
                normalizedValue={normalizedStats.compositeScore.toFixed(2)}
                normalizedLabel="Score"
              />
            )}
          </div>

          {/* Per-season breakdown table */}
          {normalizedStats && !eraUnavailable && seasons.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="bg-[#0c0c0e]">
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Season
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Wins
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Podiums
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Points
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Races
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/30">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((s) => (
                    <tr
                      key={s.season}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] last:border-0"
                    >
                      <td className="px-3 py-2 font-medium text-white">{s.season}</td>
                      <td className="px-3 py-2 text-white/70">{s.wins}</td>
                      <td className="px-3 py-2 text-white/70">{s.podiums}</td>
                      <td className="px-3 py-2 text-white/70">{s.points}</td>
                      <td className="px-3 py-2 text-white/70">{s.races}</td>
                      <td className="px-3 py-2 text-white/70">
                        {s.position != null ? `P${s.position}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ranking view */}
      {viewMode === 'ranking' && !isLoading && (
        <div className="space-y-3">
          {eraUnavailable ? (
            <div className="flex min-h-[150px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
              <p className="text-[14px] text-white/40">
                All-Time Ranking requires era metadata. Please try again later.
              </p>
            </div>
          ) : normalizedStats ? (
            <>
              {/* Current driver's ranking card */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Current Ranking
                    </p>
                    <p className="text-lg font-bold text-white">{entityName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Composite Score
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-red-400">
                      {normalizedStats.compositeScore.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* All-time greats reference list */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                    All-Time Greats Reference
                  </h3>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
                <div className="space-y-1.5">
                  {rankings && rankings.length > 0 && (
                    <RankingRow
                      rank={1}
                      name={entityName}
                      score={normalizedStats.compositeScore}
                      isHighlighted={true}
                    />
                  )}
                  {ALL_TIME_GREATS.map((great, idx) => {
                    const isCurrentDriver =
                      entityType === 'driver' && (career as DriverCareer).driverId === great.slug;
                    if (isCurrentDriver) return null;
                    return (
                      <RankingRow
                        key={great.slug}
                        rank={idx + 2}
                        name={great.name}
                        score={0}
                        isHighlighted={false}
                      />
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-white/30">
                  Note: Full ranking requires career data for all drivers. Scores shown are for the
                  current {entityType} only.
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
