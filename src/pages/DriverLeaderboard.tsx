import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { m } from 'motion/react';
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
  LeaderboardDriver,
  DriverStatEntry,
  StreakEntry,
} from '@/lib/api';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Search, ArrowUpDown, Filter } from 'lucide-react';

// ---------------------------------------------------------------------------
// Stat definitions
// ---------------------------------------------------------------------------

interface StatDefinition {
  slug: string;
  title: string;
  description: string;
  valueLabel: string;
  formatValue: (v: number) => string;
  sortAsc?: boolean; // true = lower is better (avg finish)
  type: 'leaderboard' | 'stat' | 'streak';
}

const STAT_DEFINITIONS: StatDefinition[] = [
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
    description: 'Most retirements from races (mechanical failures, accidents, etc.)',
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

// ---------------------------------------------------------------------------
// Nationality filter options
// ---------------------------------------------------------------------------

const NATIONALITY_OPTIONS = [
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Flag({ nationality }: { nationality: string | null }) {
  if (!nationality) return null;
  return (
    <img
      src={`https://flagcdn.com/${getNationalityCountryCode(nationality)}.svg`}
      alt={nationality}
      className="h-3.5 w-auto rounded-sm opacity-80"
    />
  );
}

type SortDirection = 'asc' | 'desc';

interface UnifiedRow {
  driver_id: string;
  name: string;
  nationality: string;
  value: number;
  extra?: string; // e.g. streak year range
}

function normalizeLeaderboardData(
  stat: StatDefinition,
  leaderboardData: LeaderboardDriver[] | undefined,
  statData: DriverStatEntry[] | undefined,
  streakData: StreakEntry[] | undefined
): UnifiedRow[] {
  if (stat.type === 'streak' && streakData) {
    return streakData.map((d) => ({
      driver_id: d.driver_id,
      name: d.name,
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
      driver_id: d.driver_id,
      name: d.name,
      nationality: d.nationality,
      value: d.value,
    }));
  }

  if (stat.type === 'leaderboard' && leaderboardData) {
    const key = getLeaderboardKey(stat.slug);
    return leaderboardData.map((d) => ({
      driver_id: d.driver_id,
      name: d.name,
      nationality: d.nationality,
      value: Number((d as unknown as Record<string, unknown>)[key] ?? 0),
    }));
  }

  return [];
}

function getLeaderboardKey(slug: string): string {
  switch (slug) {
    case 'world-championships':
      return 'championships';
    case 'most-race-wins':
      return 'total_wins';
    case 'most-podiums':
      return 'total_podiums';
    case 'most-pole-positions':
      return 'total_poles';
    case 'most-career-points':
      return 'total_points';
    default:
      return 'value';
  }
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const FETCH_LIMIT = 500; // Fetch a large set for the full view

const DriverLeaderboard = () => {
  const { stat: statSlug } = useParams<{ stat: string }>();
  const navigate = useNavigate();

  const statDef = STAT_DEFINITIONS.find((s) => s.slug === statSlug) ?? STAT_DEFINITIONS[0];

  const [search, setSearch] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('All');
  const [sortDir, setSortDir] = useState<SortDirection>(statDef.sortAsc ? 'asc' : 'desc');

  // Fetch data based on stat type
  const { data: winsData, isLoading: winsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'wins'],
    queryFn: () => fetchDriverWinsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-race-wins',
  });

  const { data: podiumsData, isLoading: podiumsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'podiums'],
    queryFn: () => fetchDriverPodiumsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-podiums',
  });

  const { data: polesData, isLoading: polesLoading } = useQuery({
    queryKey: ['leaderboard-full', 'poles'],
    queryFn: () => fetchDriverPolesLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-pole-positions',
  });

  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'points'],
    queryFn: () => fetchDriverPointsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-career-points',
  });

  const { data: champsData, isLoading: champsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'championships'],
    queryFn: () => fetchDriverChampionshipsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'world-championships',
  });

  const { data: fastestLapsData, isLoading: fastestLapsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'fastestLaps'],
    queryFn: () => fetchDriverFastestLapsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-fastest-laps',
  });

  const { data: winPctData, isLoading: winPctLoading } = useQuery({
    queryKey: ['leaderboard-full', 'winPct'],
    queryFn: () => fetchDriverWinPctLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'best-win-%',
  });

  const { data: avgFinishData, isLoading: avgFinishLoading } = useQuery({
    queryKey: ['leaderboard-full', 'avgFinish'],
    queryFn: () => fetchDriverAvgFinishLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'best-average-finish',
  });

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['leaderboard-full', 'entries'],
    queryFn: () => fetchDriverEntriesLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-race-entries',
  });

  const { data: seasonsData, isLoading: seasonsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'seasons'],
    queryFn: () => fetchDriverSeasonsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-seasons-driven',
  });

  const { data: dnfsData, isLoading: dnfsLoading } = useQuery({
    queryKey: ['leaderboard-full', 'dnfs'],
    queryFn: () => fetchDriverDnfLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-dnfs',
  });

  const { data: winStreaksData, isLoading: winStreaksLoading } = useQuery({
    queryKey: ['leaderboard-full', 'winStreaks'],
    queryFn: () => fetchDriverWinStreaks(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'longest-win-streaks',
  });

  const { data: podiumStreaksData, isLoading: podiumStreaksLoading } = useQuery({
    queryKey: ['leaderboard-full', 'podiumStreaks'],
    queryFn: () => fetchDriverPodiumStreaks(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'longest-podium-streaks',
  });

  // Determine loading state
  const isLoading =
    winsLoading ||
    podiumsLoading ||
    polesLoading ||
    pointsLoading ||
    champsLoading ||
    fastestLapsLoading ||
    winPctLoading ||
    avgFinishLoading ||
    entriesLoading ||
    seasonsLoading ||
    dnfsLoading ||
    winStreaksLoading ||
    podiumStreaksLoading;

  // Get the right data for the current stat
  const currentLeaderboardData = useMemo(() => {
    const map: Record<string, LeaderboardDriver[] | undefined> = {
      'most-race-wins': winsData,
      'most-podiums': podiumsData,
      'most-pole-positions': polesData,
      'most-career-points': pointsData,
      'world-championships': champsData,
    };
    return map[statDef.slug];
  }, [statDef.slug, winsData, podiumsData, polesData, pointsData, champsData]);

  const currentStatData = useMemo(() => {
    const map: Record<string, DriverStatEntry[] | undefined> = {
      'most-fastest-laps': fastestLapsData,
      'best-win-%': winPctData,
      'best-average-finish': avgFinishData,
      'most-race-entries': entriesData,
      'most-seasons-driven': seasonsData,
      'most-dnfs': dnfsData,
    };
    return map[statDef.slug];
  }, [
    statDef.slug,
    fastestLapsData,
    winPctData,
    avgFinishData,
    entriesData,
    seasonsData,
    dnfsData,
  ]);

  const currentStreakData = useMemo(() => {
    const map: Record<string, StreakEntry[] | undefined> = {
      'longest-win-streaks': winStreaksData,
      'longest-podium-streaks': podiumStreaksData,
    };
    return map[statDef.slug];
  }, [statDef.slug, winStreaksData, podiumStreaksData]);

  // Normalize and filter data
  const rows = useMemo(() => {
    const raw = normalizeLeaderboardData(
      statDef,
      currentLeaderboardData,
      currentStatData,
      currentStreakData
    );

    let filtered = raw;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(q) || r.nationality.toLowerCase().includes(q)
      );
    }

    // Nationality filter
    if (nationalityFilter !== 'All') {
      filtered = filtered.filter((r) => r.nationality === nationalityFilter);
    }

    // Sort
    filtered.sort((a, b) => (sortDir === 'desc' ? b.value - a.value : a.value - b.value));

    return filtered;
  }, [
    statDef,
    currentLeaderboardData,
    currentStatData,
    currentStreakData,
    search,
    nationalityFilter,
    sortDir,
  ]);

  const toggleSort = () => {
    setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <>
      <SEO title={`${statDef.title} — Driver Leaderboard`} description={statDef.description} />

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/drivers"
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to All Records
        </Link>

        <m.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[20px] font-semibold tracking-tight text-white"
        >
          {statDef.title}
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-0.5 text-[12px] text-white/50"
        >
          {statDef.description}
        </m.p>
      </div>

      {/* Stat selector */}
      <div className="mb-5">
        <Select
          value={statDef.slug}
          onValueChange={(val) => {
            const newDef = STAT_DEFINITIONS.find((s) => s.slug === val);
            if (newDef) {
              setSortDir(newDef.sortAsc ? 'asc' : 'desc');
              navigate(`/drivers/leaderboard/${val}`);
            }
          }}
        >
          <SelectTrigger className="w-full max-w-xs border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAT_DEFINITIONS.map((s) => (
              <SelectItem key={s.slug} value={s.slug}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <m.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/[0.08] bg-white/[0.02] pl-9 text-[13px] text-white/90 placeholder:text-white/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-white/30" />
            <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
              <SelectTrigger className="w-[160px] border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
                <SelectValue placeholder="Nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITY_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={toggleSort}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[12px] text-white/60 transition-colors hover:bg-white/[0.04] hover:text-white/80"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortDir === 'desc' ? 'Highest first' : 'Lowest first'}
          </button>
        </div>
      </m.div>

      {/* Results count */}
      <div className="mb-3 text-[12px] text-white/40">
        {isLoading ? 'Loading...' : `${rows.length} drivers`}
      </div>

      {/* Table */}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className={`${CARD_CONTAINER} overflow-hidden`}
      >
        {/* Table header */}
        <div className="flex items-center border-b border-white/[0.06] px-5 py-3">
          <span className="w-10 shrink-0 text-[11px] font-medium uppercase tracking-wider text-white/30">
            #
          </span>
          <span className="flex-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
            Driver
          </span>
          <span className="shrink-0 text-right text-[11px] font-medium uppercase tracking-wider text-white/30">
            {statDef.valueLabel}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-white/[0.03]">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="h-4 w-5 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
                <div className="ml-auto h-4 w-12 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-white/40">
            No drivers found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {rows.map((row, i) => (
              <Link
                key={`${row.driver_id}-${i}`}
                to={`/drivers/${row.driver_id}`}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
              >
                <span className="w-10 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                  {i + 1}
                </span>

                <Flag nationality={row.nationality} />

                <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                  {row.name}
                </span>

                <span className="shrink-0 text-[11px] text-white/40">{row.nationality}</span>

                {row.extra && (
                  <span className="shrink-0 text-[11px] text-white/40">{row.extra}</span>
                )}

                <span className="w-20 shrink-0 text-right font-mono text-[13px] tabular-nums text-white">
                  {statDef.formatValue(row.value)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </m.div>
    </>
  );
};

export default DriverLeaderboard;
