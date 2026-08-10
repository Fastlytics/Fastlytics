import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import {
  fetchDriverWinsLeaderboard,
  fetchDriverPodiumsLeaderboard,
  fetchDriverPolesLeaderboard,
  fetchDriverPointsLeaderboard,
  fetchDriverChampionshipsLeaderboard,
  fetchDriverWinPctLeaderboard,
  fetchDriverEntriesLeaderboard,
  fetchDriverDnfLeaderboard,
  fetchDriverFastestLapsLeaderboard,
  fetchDriverAvgFinishLeaderboard,
  fetchDriverSeasonsLeaderboard,
  fetchDriverWinStreaks,
  fetchDriverPodiumStreaks,
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
  LeaderboardDriver,
  DriverStatEntry,
  StreakEntry,
  LeaderboardTeam,
  TeamStatEntry,
  TeamStreakEntry,
} from '@/lib/api';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { getTeamSlug, getTeamLogo } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { cn } from '@/lib/utils';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

// ---------------------------------------------------------------------------
// Stat definitions (mirror desktop)
// ---------------------------------------------------------------------------

interface StatDefinition {
  slug: string;
  title: string;
  description: string;
  valueLabel: string;
  formatValue: (v: number) => string;
  sortAsc?: boolean;
  type: 'leaderboard' | 'stat' | 'streak';
}

const DRIVER_STATS: StatDefinition[] = [
  {
    slug: 'world-championships',
    title: 'World Championships',
    description: 'All-time driver world championship titles',
    valueLabel: 'Championships',
    formatValue: (v) => `${v}×`,
    type: 'leaderboard',
  },
  {
    slug: 'most-race-wins',
    title: 'Most Race Wins',
    description: 'All-time race victories',
    valueLabel: 'Wins',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-podiums',
    title: 'Most Podiums',
    description: 'All-time podium finishes (top 3)',
    valueLabel: 'Podiums',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-pole-positions',
    title: 'Most Pole Positions',
    description: 'All-time pole positions in qualifying',
    valueLabel: 'Poles',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-career-points',
    title: 'Most Career Points',
    description: 'All-time career points scored',
    valueLabel: 'Points',
    formatValue: (v) => Number(v).toLocaleString(),
    type: 'leaderboard',
  },
  {
    slug: 'most-fastest-laps',
    title: 'Most Fastest Laps',
    description: 'Most race fastest laps set (data available from 2004 onwards)',
    valueLabel: 'Fastest Laps',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'best-win-%',
    title: 'Best Win %',
    description: 'Highest win percentage (minimum 20 race entries)',
    valueLabel: 'Win %',
    formatValue: (v) => `${v}%`,
    type: 'stat',
  },
  {
    slug: 'best-average-finish',
    title: 'Best Average Finish',
    description: 'Lowest average finishing position (minimum 20 race entries)',
    valueLabel: 'Avg Finish',
    formatValue: (v) => `P${Number(v).toFixed(2)}`,
    sortAsc: true,
    type: 'stat',
  },
  {
    slug: 'most-race-entries',
    title: 'Most Race Entries',
    description: 'Most Grand Prix starts',
    valueLabel: 'Entries',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'most-seasons-driven',
    title: 'Most Seasons Driven',
    description: 'Most seasons with at least one race entry',
    valueLabel: 'Seasons',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'most-dnfs',
    title: 'Most DNFs',
    description: 'Most retirements from races',
    valueLabel: 'DNFs',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'longest-win-streaks',
    title: 'Longest Win Streaks',
    description: 'Most consecutive race wins',
    valueLabel: 'Streak',
    formatValue: (v) => `${v} races`,
    type: 'streak',
  },
  {
    slug: 'longest-podium-streaks',
    title: 'Longest Podium Streaks',
    description: 'Most consecutive podium finishes',
    valueLabel: 'Streak',
    formatValue: (v) => `${v} races`,
    type: 'streak',
  },
];

const TEAM_STATS: StatDefinition[] = [
  {
    slug: "constructors'-championships",
    title: "Constructors' Championships",
    description: 'All-time constructor world championship titles since 1958',
    valueLabel: 'Championships',
    formatValue: (v) => `${v}×`,
    type: 'leaderboard',
  },
  {
    slug: 'most-race-wins',
    title: 'Most Race Wins',
    description: 'All-time race victories by constructor',
    valueLabel: 'Wins',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-podiums',
    title: 'Most Podiums',
    description: 'All-time podium finishes (top 3) by constructor',
    valueLabel: 'Podiums',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-pole-positions',
    title: 'Most Pole Positions',
    description: 'All-time pole positions by constructor',
    valueLabel: 'Poles',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-career-points',
    title: 'Most Career Points',
    description: 'All-time career points scored by constructor',
    valueLabel: 'Points',
    formatValue: (v) => Number(v).toLocaleString(),
    type: 'leaderboard',
  },
  {
    slug: 'most-fastest-laps',
    title: 'Most Fastest Laps',
    description: 'Most race fastest laps by constructor',
    valueLabel: 'Fastest Laps',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'best-win-%',
    title: 'Best Win %',
    description: 'Highest win percentage (minimum 50 race entries)',
    valueLabel: 'Win %',
    formatValue: (v) => `${v}%`,
    type: 'stat',
  },
  {
    slug: 'best-podium-%',
    title: 'Best Podium %',
    description: 'Highest podium percentage (minimum 50 race entries)',
    valueLabel: 'Podium %',
    formatValue: (v) => `${v}%`,
    type: 'stat',
  },
  {
    slug: 'best-average-finish',
    title: 'Best Average Finish',
    description: 'Lowest average finishing position (minimum 50 race entries)',
    valueLabel: 'Avg Finish',
    formatValue: (v) => `P${Number(v).toFixed(2)}`,
    sortAsc: true,
    type: 'stat',
  },
  {
    slug: 'most-1-2-finishes',
    title: 'Most 1-2 Finishes',
    description: 'Most 1-2 finishes by a constructor',
    valueLabel: '1-2s',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'points-per-race',
    title: 'Points Per Race',
    description: 'Highest points per race average (minimum 50 race entries)',
    valueLabel: 'Pts/Race',
    formatValue: (v) => Number(v).toFixed(2),
    type: 'stat',
  },
  {
    slug: 'most-race-entries',
    title: 'Most Race Entries',
    description: 'Most Grand Prix entries by constructor',
    valueLabel: 'Entries',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-seasons-active',
    title: 'Most Seasons Active',
    description: 'Most seasons with at least one race entry',
    valueLabel: 'Seasons',
    formatValue: (v) => String(v),
    type: 'leaderboard',
  },
  {
    slug: 'most-drivers-fielded',
    title: 'Most Drivers Fielded',
    description: 'Most unique drivers fielded by a constructor',
    valueLabel: 'Drivers',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'most-dnfs',
    title: 'Most DNFs',
    description: 'Most retirements from races by constructor',
    valueLabel: 'DNFs',
    formatValue: (v) => String(v),
    type: 'stat',
  },
  {
    slug: 'longest-win-streaks',
    title: 'Longest Win Streaks',
    description: 'Most consecutive race wins by a constructor',
    valueLabel: 'Streak',
    formatValue: (v) => `${v} races`,
    type: 'streak',
  },
  {
    slug: 'longest-podium-streaks',
    title: 'Longest Podium Streaks',
    description: 'Most consecutive podium finishes by a constructor',
    valueLabel: 'Streak',
    formatValue: (v) => `${v} races`,
    type: 'streak',
  },
  {
    slug: 'longest-points-streaks',
    title: 'Longest Points Streaks',
    description: 'Most consecutive points finishes by a constructor',
    valueLabel: 'Streak',
    formatValue: (v) => `${v} races`,
    type: 'streak',
  },
];

const DRIVER_NATIONALITIES = [
  'All',
  'Argentine',
  'Australian',
  'Austrian',
  'Belgian',
  'Brazilian',
  'British',
  'Canadian',
  'Danish',
  'Dutch',
  'Finnish',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Mexican',
  'Monegasque',
  'New Zealander',
  'Polish',
  'Spanish',
  'Swedish',
  'Swiss',
  'Thai',
];

const TEAM_NATIONALITIES = [
  'All',
  'American',
  'Austrian',
  'British',
  'French',
  'German',
  'Indian',
  'Italian',
  'Japanese',
  'Malaysian',
  'Swiss',
];

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

type SortDirection = 'asc' | 'desc';

interface UnifiedRow {
  id: string;
  name: string;
  code?: string | null;
  nationality: string;
  value: number;
  extra?: string;
}

function normalizeRows(
  stat: StatDefinition,
  kind: 'drivers' | 'teams',
  leaderboardData: (LeaderboardDriver | LeaderboardTeam)[] | undefined,
  statData: (DriverStatEntry | TeamStatEntry)[] | undefined,
  streakData: (StreakEntry | TeamStreakEntry)[] | undefined
): UnifiedRow[] {
  if (stat.type === 'streak' && streakData) {
    return streakData.map((d) => ({
      id: 'constructor_id' in d ? d.constructor_id : d.driver_id,
      name: d.name,
      code: 'code' in d ? d.code : null,
      nationality: d.nationality,
      value: d.streak_length,
      extra:
        d.streak_start_year === d.streak_end_year
          ? String(d.streak_start_year)
          : `${d.streak_start_year}–${d.streak_end_year}`,
    }));
  }
  if (stat.type === 'stat' && statData) {
    return statData.map((d) => ({
      id: 'constructor_id' in d ? d.constructor_id : d.driver_id,
      name: d.name,
      code: 'code' in d ? d.code : null,
      nationality: d.nationality,
      value: d.value,
    }));
  }
  if (stat.type === 'leaderboard' && leaderboardData) {
    return leaderboardData.map((d) => ({
      id: 'constructor_id' in d ? d.constructor_id : d.driver_id,
      name: d.name,
      code: 'code' in d ? d.code : null,
      nationality: d.nationality,
      value: Number((d as unknown as Record<string, unknown>)[getLeaderboardKey(stat.slug)] ?? 0),
    }));
  }
  return [];
}

function getLeaderboardKey(slug: string): string {
  switch (slug) {
    case 'world-championships':
    case "constructors'-championships":
      return 'championships';
    case 'most-race-wins':
      return 'total_wins';
    case 'most-podiums':
      return 'total_podiums';
    case 'most-pole-positions':
      return 'total_poles';
    case 'most-career-points':
      return 'total_points';
    case 'most-race-entries':
      return 'total_races';
    case 'most-seasons-active':
      return 'total_seasons';
    default:
      return 'value';
  }
}

const FETCH_LIMIT = 500;

// ---------------------------------------------------------------------------
// Main component — parametric for drivers / teams
// ---------------------------------------------------------------------------

const MobileLeaderboard: React.FC<{ kind: 'drivers' | 'teams' }> = ({ kind }) => {
  const { stat: statSlug } = useParams<{ stat: string }>();
  const navigate = useNavigate();
  const isDrivers = kind === 'drivers';
  const STATS = isDrivers ? DRIVER_STATS : TEAM_STATS;
  const NATIONALITIES = isDrivers ? DRIVER_NATIONALITIES : TEAM_NATIONALITIES;

  const statDef = STATS.find((s) => s.slug === statSlug) ?? STATS[0];

  const [search, setSearch] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('All');
  const [sortDir, setSortDir] = useState<SortDirection>(statDef.sortAsc ? 'asc' : 'desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Queries (same keys as desktop → shared cache) ──
  const baseOpts = { staleTime: 1000 * 60 * 60 } as const;
  const useQ = (key: string, fn: () => Promise<unknown>, enabled: boolean) =>
    useQuery({ queryKey: [`${kind}-leaderboard-full`, key], queryFn: fn, ...baseOpts, enabled });

  const winsQ = useQ(
    'wins',
    isDrivers
      ? () => fetchDriverWinsLeaderboard(FETCH_LIMIT)
      : () => fetchTeamWinsLeaderboard(FETCH_LIMIT),
    statSlug === 'most-race-wins'
  );
  const champsQ = useQ(
    'championships',
    isDrivers
      ? () => fetchDriverChampionshipsLeaderboard(FETCH_LIMIT)
      : () => fetchTeamChampionshipsLeaderboard(FETCH_LIMIT),
    statSlug === (isDrivers ? 'world-championships' : "constructors'-championships")
  );
  const podiumsQ = useQ(
    'podiums',
    isDrivers
      ? () => fetchDriverPodiumsLeaderboard(FETCH_LIMIT)
      : () => fetchTeamPodiumsLeaderboard(FETCH_LIMIT),
    statSlug === 'most-podiums'
  );
  const polesQ = useQ(
    'poles',
    isDrivers
      ? () => fetchDriverPolesLeaderboard(FETCH_LIMIT)
      : () => fetchTeamPolesLeaderboard(FETCH_LIMIT),
    statSlug === 'most-pole-positions'
  );
  const pointsQ = useQ(
    'points',
    isDrivers
      ? () => fetchDriverPointsLeaderboard(FETCH_LIMIT)
      : () => fetchTeamPointsLeaderboard(FETCH_LIMIT),
    statSlug === 'most-career-points'
  );
  const entriesQ = useQ(
    'entries',
    isDrivers
      ? () => fetchDriverEntriesLeaderboard(FETCH_LIMIT)
      : () => fetchTeamEntriesLeaderboard(FETCH_LIMIT),
    statSlug === 'most-race-entries'
  );
  const seasonsQ = useQ(
    'seasons',
    isDrivers
      ? () => fetchDriverSeasonsLeaderboard(FETCH_LIMIT)
      : () => fetchTeamSeasonsLeaderboard(FETCH_LIMIT),
    statSlug === (isDrivers ? 'most-seasons-driven' : 'most-seasons-active')
  );
  const fastestLapsQ = useQ(
    'fastestLaps',
    isDrivers
      ? () => fetchDriverFastestLapsLeaderboard(FETCH_LIMIT)
      : () => fetchTeamFastestLapsLeaderboard(FETCH_LIMIT),
    statSlug === 'most-fastest-laps'
  );
  const winPctQ = useQ(
    'winPct',
    isDrivers
      ? () => fetchDriverWinPctLeaderboard(FETCH_LIMIT)
      : () => fetchTeamWinPctLeaderboard(FETCH_LIMIT),
    statSlug === 'best-win-%'
  );
  const avgFinishQ = useQ(
    'avgFinish',
    isDrivers
      ? () => fetchDriverAvgFinishLeaderboard(FETCH_LIMIT)
      : () => fetchTeamAvgFinishLeaderboard(FETCH_LIMIT),
    statSlug === 'best-average-finish'
  );
  const dnfsQ = useQ(
    'dnfs',
    isDrivers
      ? () => fetchDriverDnfLeaderboard(FETCH_LIMIT)
      : () => fetchTeamDnfLeaderboard(FETCH_LIMIT),
    statSlug === 'most-dnfs'
  );
  const winStreaksQ = useQ(
    'winStreaks',
    isDrivers ? () => fetchDriverWinStreaks(FETCH_LIMIT) : () => fetchTeamWinStreaks(FETCH_LIMIT),
    statSlug === 'longest-win-streaks'
  );
  const podiumStreaksQ = useQ(
    'podiumStreaks',
    isDrivers
      ? () => fetchDriverPodiumStreaks(FETCH_LIMIT)
      : () => fetchTeamPodiumStreaks(FETCH_LIMIT),
    statSlug === 'longest-podium-streaks'
  );

  // Team-only queries
  const podiumPctQ = useQ(
    'podiumPct',
    () => fetchTeamPodiumPctLeaderboard(FETCH_LIMIT),
    !isDrivers && statSlug === 'best-podium-%'
  );
  const oneTwoQ = useQ(
    'oneTwo',
    () => fetchTeamOneTwoLeaderboard(FETCH_LIMIT),
    !isDrivers && statSlug === 'most-1-2-finishes'
  );
  const pointsPerRaceQ = useQ(
    'pointsPerRace',
    () => fetchTeamPointsPerRaceLeaderboard(FETCH_LIMIT),
    !isDrivers && statSlug === 'points-per-race'
  );
  const driversFieldedQ = useQ(
    'driversFielded',
    () => fetchTeamDriversFieldedLeaderboard(FETCH_LIMIT),
    !isDrivers && statSlug === 'most-drivers-fielded'
  );
  const pointsStreaksQ = useQ(
    'pointsStreaks',
    () => fetchTeamPointsStreaks(FETCH_LIMIT),
    !isDrivers && statSlug === 'longest-points-streaks'
  );

  const isLoading = [
    winsQ,
    champsQ,
    podiumsQ,
    polesQ,
    pointsQ,
    entriesQ,
    seasonsQ,
    fastestLapsQ,
    winPctQ,
    avgFinishQ,
    dnfsQ,
    winStreaksQ,
    podiumStreaksQ,
    podiumPctQ,
    oneTwoQ,
    pointsPerRaceQ,
    driversFieldedQ,
    pointsStreaksQ,
  ].some((qq) => qq.isLoading);

  // Route data by slug
  const leaderboardData = useMemo(() => {
    const map: Record<string, (LeaderboardDriver | LeaderboardTeam)[] | undefined> = {
      'most-race-wins': winsQ.data,
      'most-podiums': podiumsQ.data,
      'most-pole-positions': polesQ.data,
      'most-career-points': pointsQ.data,
      'world-championships': champsQ.data,
      "constructors'-championships": champsQ.data,
      'most-race-entries': entriesQ.data,
      'most-seasons-active': seasonsQ.data,
    };
    return map[statDef.slug];
  }, [
    statDef.slug,
    winsQ.data,
    podiumsQ.data,
    polesQ.data,
    pointsQ.data,
    champsQ.data,
    entriesQ.data,
    seasonsQ.data,
  ]);

  const statData = useMemo(() => {
    const map: Record<string, (DriverStatEntry | TeamStatEntry)[] | undefined> = {
      'most-fastest-laps': fastestLapsQ.data,
      'best-win-%': winPctQ.data,
      'best-podium-%': podiumPctQ.data,
      'best-average-finish': avgFinishQ.data,
      'most-1-2-finishes': oneTwoQ.data,
      'points-per-race': pointsPerRaceQ.data,
      'most-drivers-fielded': driversFieldedQ.data,
      'most-race-entries': entriesQ.data,
      'most-seasons-driven': seasonsQ.data,
      'most-dnfs': dnfsQ.data,
    };
    return map[statDef.slug];
  }, [
    statDef.slug,
    fastestLapsQ.data,
    winPctQ.data,
    podiumPctQ.data,
    avgFinishQ.data,
    oneTwoQ.data,
    pointsPerRaceQ.data,
    driversFieldedQ.data,
    entriesQ.data,
    seasonsQ.data,
    dnfsQ.data,
  ]);

  const streakData = useMemo(() => {
    const map: Record<string, (StreakEntry | TeamStreakEntry)[] | undefined> = {
      'longest-win-streaks': winStreaksQ.data,
      'longest-podium-streaks': podiumStreaksQ.data,
      'longest-points-streaks': pointsStreaksQ.data,
    };
    return map[statDef.slug];
  }, [statDef.slug, winStreaksQ.data, podiumStreaksQ.data, pointsStreaksQ.data]);

  // Normalize + filter + sort
  const rows = useMemo(() => {
    const raw = normalizeRows(statDef, kind, leaderboardData, statData, streakData);
    let filtered = raw;
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(query) || r.nationality.toLowerCase().includes(query)
      );
    }
    if (nationalityFilter !== 'All') {
      filtered = filtered.filter((r) => r.nationality === nationalityFilter);
    }
    filtered.sort((a, b) => (sortDir === 'desc' ? b.value - a.value : a.value - b.value));
    return filtered;
  }, [statDef, kind, leaderboardData, statData, streakData, search, nationalityFilter, sortDir]);

  const activeFilterCount = (search.trim() ? 1 : 0) + (nationalityFilter !== 'All' ? 1 : 0);

  const selectStat = (slug: string) => {
    const def = STATS.find((s) => s.slug === slug);
    if (!def) return;
    setSortDir(def.sortAsc ? 'asc' : 'desc');
    navigate(`/${kind}/leaderboard/${slug}`);
  };

  const entityLabel = isDrivers ? 'drivers' : 'constructors';
  const backPath = isDrivers ? '/drivers' : '/teams';
  const currentYear = getCurrentSeasonYear();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky logo header */}
      <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pb-2 pt-3 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
        <Link
          to={backPath}
          className="active:scale-[0.98] -ml-1 flex size-8 items-center justify-center rounded-lg border border-white/[0.04] text-white/60 transition-colors"
        >
          <ArrowLeftIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-semibold tracking-[-0.01em] text-white">
            {statDef.title}
          </h1>
          <p className="truncate text-[11px] text-white/40">{statDef.description}</p>
        </div>
      </div>

      {/* Stat selector — horizontal scroll chips */}
      <div className="px-4 pt-2">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {STATS.map((s) => (
            <button
              key={s.slug}
              onClick={() => selectStat(s.slug)}
              className={cn(
                'flex-shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all active:scale-[0.98]',
                statDef.slug === s.slug
                  ? 'border border-white/[0.12] bg-white/[0.12] text-white'
                  : 'border border-white/[0.04] text-white/40'
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${entityLabel}...`}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 pl-9 pr-3 text-[13px] text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-white/[0.15]"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            'active:scale-[0.98] flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
            filtersOpen || nationalityFilter !== 'All'
              ? 'border-white/[0.12] bg-white/[0.06] text-white'
              : 'border-white/[0.04] text-white/50'
          )}
        >
          <FilterIcon className="size-4" />
        </button>
        <button
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="active:scale-[0.98] flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.04] text-white/50 transition-colors"
          title={sortDir === 'desc' ? 'Highest first' : 'Lowest first'}
        >
          <SortIcon className="size-4" />
        </button>
      </div>

      {/* Nationality filter (collapsible) */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-2 pt-3">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Nationality
              </span>
              <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
                {NATIONALITIES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNationalityFilter(n)}
                    className={cn(
                      'flex-shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all active:scale-[0.98]',
                      nationalityFilter === n
                        ? 'border border-white/[0.12] bg-white/[0.12] text-white'
                        : 'border border-white/[0.04] text-white/40'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="text-[11px] text-white/30">
          {isLoading ? 'Loading…' : `${rows.length} ${entityLabel}`}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setSearch('');
              setNationalityFilter('All');
            }}
            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/40 active:text-white/70"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-1 px-4 pb-4">
        {isLoading ? (
          Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="flex h-14 animate-pulse items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3"
            >
              <div className="h-3 w-6 rounded bg-white/[0.06]" />
              <div className="h-4 w-10 rounded bg-white/[0.06]" />
              <div className="h-3 flex-1 rounded bg-white/[0.06]" />
              <div className="h-3 w-12 rounded bg-white/[0.06]" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] py-12 text-center">
            <p className="text-[13px] font-medium text-white/40">
              No {entityLabel} found matching your filters.
            </p>
          </div>
        ) : (
          rows.map((row, i) => {
            const href = isDrivers ? `/drivers/${row.id}` : `/teams/${getTeamSlug(row.name)}`;
            return (
              <Link
                key={`${row.id}-${i}`}
                to={href}
                className="active:scale-[0.98] flex items-center gap-3 rounded-lg border border-white/[0.04] px-3 py-2.5 transition-colors"
              >
                <span className="w-6 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                  {i + 1}
                </span>

                {/* Avatar / logo */}
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.04] bg-white/[0.03]">
                  {isDrivers ? (
                    row.code ? (
                      <img
                        src={getDriverImage(row.code, currentYear)}
                        alt={row.name}
                        className="h-full w-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null
                  ) : getTeamLogo(row.name) ? (
                    <img
                      src={getTeamLogo(row.name)!}
                      alt={row.name}
                      className="h-5 w-5 object-contain"
                    />
                  ) : null}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">{row.name}</p>
                  <p className="truncate text-[11px] text-white/30">
                    <Flag nationality={row.nationality} />
                    <span className="ml-1">{row.nationality}</span>
                    {row.extra && <span className="ml-1.5">{row.extra}</span>}
                  </p>
                </div>

                {/* Value */}
                <span className="shrink-0 font-mono text-[14px] tabular-nums text-white">
                  {statDef.formatValue(row.value)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Small inline icons (avoid extra icon deps) ---

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 16 4 4 4-4" />
      <path d="M7 20V4" />
      <path d="m21 8-4-4-4 4" />
      <path d="M17 4v16" />
    </svg>
  );
}

function Flag({ nationality }: { nationality: string | null }) {
  if (!nationality) return null;
  return (
    <img
      src={`https://flagcdn.com/${getNationalityCountryCode(nationality)}.svg`}
      alt={nationality}
      className="inline h-3 w-auto rounded-sm opacity-80"
    />
  );
}

export default MobileLeaderboard;
