import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  fetchTeamWinsLeaderboard,
  fetchTeamChampionshipsLeaderboard,
  fetchTeamPodiumsLeaderboard,
  fetchTeamPolesLeaderboard,
  fetchTeamPointsLeaderboard,
  fetchTeamEntriesLeaderboard,
  fetchTeamSeasonsLeaderboard,
  fetchTeamWinPctLeaderboard,
  fetchTeamPodiumPctLeaderboard,
  fetchTeamAvgFinishLeaderboard,
  fetchTeamOneTwoLeaderboard,
  fetchTeamDnfLeaderboard,
  fetchTeamFastestLapsLeaderboard,
  fetchTeamDriversFieldedLeaderboard,
  fetchTeamWinStreaks,
  fetchTeamPodiumStreaks,
  fetchTeamPointsStreaks,
  fetchTeamPointsPerRaceLeaderboard,
  LeaderboardTeam,
  TeamStatEntry,
  TeamStreakEntry,
} from '@/lib/api';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getNationalityCountryCode } from '@/utils/countryUtils';

const TOP_N = 10;

const teamSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

function Flag({ nationality }: { nationality: string | null }) {
  if (!nationality) return null;
  return (
    <img
      src={`https://flagcdn.com/${getNationalityCountryCode(nationality)}.svg`}
      alt={nationality}
      className="h-3 w-auto rounded-sm opacity-70"
    />
  );
}

function SeeAllLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center gap-1 px-5 py-2.5 text-[12px] font-medium text-white/40 transition-colors hover:bg-white/[0.02] hover:text-white/70"
    >
      See all
      <span className="text-white/30">→</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard Table (LeaderboardTeam[] — core stats)
// ---------------------------------------------------------------------------

function LeaderboardTable({
  title,
  data,
  isLoading,
  columns,
  delay = 0,
}: {
  title: string;
  data: LeaderboardTeam[] | undefined;
  isLoading: boolean;
  columns: { key: string; label: string; format?: (v: unknown, row: LeaderboardTeam) => string }[];
  delay?: number;
}) {
  const rows = data?.slice(0, TOP_N);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`${CARD_CONTAINER} overflow-hidden`}
    >
      <div className="border-b border-white/[0.04] px-5 py-3.5">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/50">{title}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-0 divide-y divide-white/[0.03]">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="ml-auto h-4 w-10 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows?.map((team, i) => (
            <Link
              key={`${team.constructor_id}-${i}`}
              to={`/teams/${teamSlug(team.name)}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <span className="w-5 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                {i + 1}
              </span>

              <Flag nationality={team.nationality} />

              <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">{team.name}</span>

              {columns.map((col) => (
                <span
                  key={col.key}
                  className="shrink-0 font-mono text-[13px] tabular-nums text-white"
                >
                  {col.format
                    ? col.format((team as unknown as Record<string, unknown>)[col.key], team)
                    : String((team as unknown as Record<string, unknown>)[col.key] ?? '')}
                </span>
              ))}
            </Link>
          ))}
        </div>
      )}

      <SeeAllLink to="/teams" />
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Stat Table (TeamStatEntry[] — generic value-based leaderboards)
// ---------------------------------------------------------------------------

function StatTable({
  title,
  data,
  isLoading,
  formatValue,
  delay = 0,
}: {
  title: string;
  data: TeamStatEntry[] | undefined;
  isLoading: boolean;
  formatValue?: (v: number) => string;
  delay?: number;
}) {
  const rows = data?.slice(0, TOP_N);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`${CARD_CONTAINER} overflow-hidden`}
    >
      <div className="border-b border-white/[0.04] px-5 py-3.5">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/50">{title}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-0 divide-y divide-white/[0.03]">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="ml-auto h-4 w-10 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows?.map((entry, i) => (
            <Link
              key={`${entry.constructor_id}-${i}`}
              to={`/teams/${teamSlug(entry.name)}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <span className="w-5 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                {i + 1}
              </span>

              <Flag nationality={entry.nationality} />

              <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                {entry.name}
              </span>

              <span className="shrink-0 font-mono text-[13px] tabular-nums text-white">
                {formatValue ? formatValue(entry.value) : entry.value}
              </span>
            </Link>
          ))}
        </div>
      )}

      <SeeAllLink to="/teams" />
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Streak Table
// ---------------------------------------------------------------------------

function StreakTable({
  title,
  data,
  isLoading,
  delay = 0,
}: {
  title: string;
  data: TeamStreakEntry[] | undefined;
  isLoading: boolean;
  delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`${CARD_CONTAINER} overflow-hidden`}
    >
      <div className="border-b border-white/[0.04] px-5 py-3.5">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/50">{title}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-0 divide-y divide-white/[0.03]">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="ml-auto h-4 w-10 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {data?.map((entry, i) => (
            <Link
              key={`${entry.constructor_id}-${i}`}
              to={`/teams/${teamSlug(entry.name)}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <span className="w-5 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                {i + 1}
              </span>

              <Flag nationality={entry.nationality} />

              <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                {entry.name}
              </span>

              <span className="shrink-0 text-[11px] text-white/40">
                {entry.streak_start_year === entry.streak_end_year
                  ? entry.streak_start_year
                  : `${entry.streak_start_year}–${entry.streak_end_year}`}
              </span>

              <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-white">
                {entry.streak_length}
              </span>
            </Link>
          ))}
        </div>
      )}

      <SeeAllLink to="/teams" />
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const Teams = () => {
  const { data: championships, isLoading: champsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'championships'],
    queryFn: () => fetchTeamChampionshipsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: wins, isLoading: winsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'wins'],
    queryFn: () => fetchTeamWinsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: podiums, isLoading: podiumsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'podiums'],
    queryFn: () => fetchTeamPodiumsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: poles, isLoading: polesLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'poles'],
    queryFn: () => fetchTeamPolesLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'points'],
    queryFn: () => fetchTeamPointsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: fastestLaps, isLoading: fastestLapsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'fastestLaps'],
    queryFn: () => fetchTeamFastestLapsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: winPct, isLoading: winPctLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'winPct'],
    queryFn: () => fetchTeamWinPctLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: podiumPct, isLoading: podiumPctLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'podiumPct'],
    queryFn: () => fetchTeamPodiumPctLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: avgFinish, isLoading: avgFinishLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'avgFinish'],
    queryFn: () => fetchTeamAvgFinishLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: oneTwo, isLoading: oneTwoLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'oneTwo'],
    queryFn: () => fetchTeamOneTwoLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'entries'],
    queryFn: () => fetchTeamEntriesLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'seasons'],
    queryFn: () => fetchTeamSeasonsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: dnfs, isLoading: dnfsLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'dnfs'],
    queryFn: () => fetchTeamDnfLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: driversFielded, isLoading: driversFieldedLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'driversFielded'],
    queryFn: () => fetchTeamDriversFieldedLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: winStreaks, isLoading: winStreaksLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'winStreaks'],
    queryFn: () => fetchTeamWinStreaks(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: podiumStreaks, isLoading: podiumStreaksLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'podiumStreaks'],
    queryFn: () => fetchTeamPodiumStreaks(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: pointsStreaks, isLoading: pointsStreaksLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'pointsStreaks'],
    queryFn: () => fetchTeamPointsStreaks(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: pointsPerRace, isLoading: pointsPerRaceLoading } = useQuery({
    queryKey: ['teamLeaderboard', 'pointsPerRace'],
    queryFn: () => fetchTeamPointsPerRaceLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <>
      <SEO
        title="Teams — All-Time Records"
        description="Explore all-time F1 constructor records: most wins, podiums, poles, championships, and longest streaks since 1958."
      />

      <div className="mb-8">
        <m.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[20px] font-semibold tracking-tight text-white"
        >
          All-Time Constructor Records
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-0.5 text-[12px] text-white/50"
        >
          Every championship, win, podium, and record since the Constructors&apos; Championship
          began in 1958
        </m.p>
      </div>

      {/* Championships + Wins */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LeaderboardTable
          title="Constructors' Championships"
          data={championships}
          isLoading={champsLoading}
          columns={[
            { key: 'total_wins', label: 'Wins', format: (v) => `${v} wins` },
            { key: 'championships', label: 'Titles', format: (v) => `${v}×` },
          ]}
          delay={0}
        />

        <LeaderboardTable
          title="Most Race Wins"
          data={wins}
          isLoading={winsLoading}
          columns={[{ key: 'total_wins', label: 'Wins' }]}
          delay={0.05}
        />
      </div>

      {/* Podiums + Poles */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LeaderboardTable
          title="Most Podiums"
          data={podiums}
          isLoading={podiumsLoading}
          columns={[{ key: 'total_podiums', label: 'Podiums' }]}
          delay={0.1}
        />

        <LeaderboardTable
          title="Most Pole Positions"
          data={poles}
          isLoading={polesLoading}
          columns={[{ key: 'total_poles', label: 'Poles' }]}
          delay={0.15}
        />
      </div>

      {/* Points + Fastest Laps */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LeaderboardTable
          title="Most Career Points"
          data={points}
          isLoading={pointsLoading}
          columns={[
            {
              key: 'total_points',
              label: 'Points',
              format: (v) => Number(v).toLocaleString(),
            },
          ]}
          delay={0.2}
        />

        <StatTable
          title="Most Fastest Laps"
          data={fastestLaps}
          isLoading={fastestLapsLoading}
          formatValue={(v) => String(v)}
          delay={0.25}
        />
      </div>

      {/* Win % + Podium % */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable
          title="Best Win %"
          data={winPct}
          isLoading={winPctLoading}
          formatValue={(v) => `${v}%`}
          delay={0.3}
        />

        <StatTable
          title="Best Podium %"
          data={podiumPct}
          isLoading={podiumPctLoading}
          formatValue={(v) => `${v}%`}
          delay={0.35}
        />
      </div>

      {/* Avg Finish + 1-2 Finishes */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable
          title="Best Average Finish"
          data={avgFinish}
          isLoading={avgFinishLoading}
          formatValue={(v) => `P${Number(v).toFixed(2)}`}
          delay={0.4}
        />

        <StatTable
          title="Most 1-2 Finishes"
          data={oneTwo}
          isLoading={oneTwoLoading}
          formatValue={(v) => String(v)}
          delay={0.45}
        />
      </div>

      {/* Points Per Race + Entries */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable
          title="Points Per Race"
          data={pointsPerRace}
          isLoading={pointsPerRaceLoading}
          formatValue={(v) => Number(v).toFixed(2)}
          delay={0.5}
        />

        <LeaderboardTable
          title="Most Race Entries"
          data={entries}
          isLoading={entriesLoading}
          columns={[{ key: 'total_races', label: 'Races' }]}
          delay={0.55}
        />
      </div>

      {/* Seasons + Drivers Fielded */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LeaderboardTable
          title="Most Seasons Active"
          data={seasons}
          isLoading={seasonsLoading}
          columns={[{ key: 'total_seasons', label: 'Seasons' }]}
          delay={0.6}
        />

        <StatTable
          title="Most Drivers Fielded"
          data={driversFielded}
          isLoading={driversFieldedLoading}
          formatValue={(v) => String(v)}
          delay={0.65}
        />
      </div>

      {/* DNFs + Win Streaks */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable
          title="Most DNFs"
          data={dnfs}
          isLoading={dnfsLoading}
          formatValue={(v) => String(v)}
          delay={0.7}
        />

        <StreakTable
          title="Longest Win Streaks"
          data={winStreaks}
          isLoading={winStreaksLoading}
          delay={0.75}
        />
      </div>

      {/* Podium Streaks + Points Streaks */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StreakTable
          title="Longest Podium Streaks"
          data={podiumStreaks}
          isLoading={podiumStreaksLoading}
          delay={0.8}
        />

        <StreakTable
          title="Longest Points Streaks"
          data={pointsStreaks}
          isLoading={pointsStreaksLoading}
          delay={0.85}
        />
      </div>
    </>
  );
};

export default Teams;
