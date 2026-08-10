import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import { getTeamSlug } from '@/lib/teamUtils';
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
import { useIsMobile } from '@/hooks/use-mobile';
import MobileLeaderboard from '@/components/mobile/pages/MobileLeaderboard';

// ---------------------------------------------------------------------------
// Stat definitions
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

const STAT_DEFINITIONS: StatDefinition[] = [
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

// ---------------------------------------------------------------------------
// Nationality filter options
// ---------------------------------------------------------------------------

const NATIONALITY_OPTIONS = [
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
  constructor_id: string;
  name: string;
  nationality: string;
  value: number;
  extra?: string;
}

function normalizeData(
  stat: StatDefinition,
  leaderboardData: LeaderboardTeam[] | undefined,
  statData: TeamStatEntry[] | undefined,
  streakData: TeamStreakEntry[] | undefined
): UnifiedRow[] {
  if (stat.type === 'streak' && streakData) {
    return streakData.map((d) => ({
      constructor_id: d.constructor_id,
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
      constructor_id: d.constructor_id,
      name: d.name,
      nationality: d.nationality,
      value: d.value,
    }));
  }

  if (stat.type === 'leaderboard' && leaderboardData) {
    const key = getLeaderboardKey(stat.slug);
    return leaderboardData.map((d) => ({
      constructor_id: d.constructor_id,
      name: d.name,
      nationality: d.nationality,
      value: Number((d as unknown as Record<string, unknown>)[key] ?? 0),
    }));
  }

  return [];
}

function getLeaderboardKey(slug: string): string {
  switch (slug) {
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

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const FETCH_LIMIT = 500;

const TeamLeaderboard = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileLeaderboard kind="teams" />;

  return <TeamLeaderboardDesktop />;
};

const TeamLeaderboardDesktop = () => {
  const { stat: statSlug } = useParams<{ stat: string }>();
  const navigate = useNavigate();

  const statDef = STAT_DEFINITIONS.find((s) => s.slug === statSlug) ?? STAT_DEFINITIONS[0];

  const [search, setSearch] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('All');
  const [sortDir, setSortDir] = useState<SortDirection>(statDef.sortAsc ? 'asc' : 'desc');

  // Fetch data based on stat type
  const { data: winsData, isLoading: winsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'wins'],
    queryFn: () => fetchTeamWinsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-race-wins',
  });

  const { data: champsData, isLoading: champsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'championships'],
    queryFn: () => fetchTeamChampionshipsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === "constructors'-championships",
  });

  const { data: podiumsData, isLoading: podiumsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'podiums'],
    queryFn: () => fetchTeamPodiumsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-podiums',
  });

  const { data: polesData, isLoading: polesLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'poles'],
    queryFn: () => fetchTeamPolesLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-pole-positions',
  });

  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'points'],
    queryFn: () => fetchTeamPointsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-career-points',
  });

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'entries'],
    queryFn: () => fetchTeamEntriesLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-race-entries',
  });

  const { data: seasonsData, isLoading: seasonsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'seasons'],
    queryFn: () => fetchTeamSeasonsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-seasons-active',
  });

  const { data: fastestLapsData, isLoading: fastestLapsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'fastestLaps'],
    queryFn: () => fetchTeamFastestLapsLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-fastest-laps',
  });

  const { data: winPctData, isLoading: winPctLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'winPct'],
    queryFn: () => fetchTeamWinPctLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'best-win-%',
  });

  const { data: podiumPctData, isLoading: podiumPctLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'podiumPct'],
    queryFn: () => fetchTeamPodiumPctLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'best-podium-%',
  });

  const { data: avgFinishData, isLoading: avgFinishLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'avgFinish'],
    queryFn: () => fetchTeamAvgFinishLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'best-average-finish',
  });

  const { data: oneTwoData, isLoading: oneTwoLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'oneTwo'],
    queryFn: () => fetchTeamOneTwoLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-1-2-finishes',
  });

  const { data: pointsPerRaceData, isLoading: pointsPerRaceLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'pointsPerRace'],
    queryFn: () => fetchTeamPointsPerRaceLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'points-per-race',
  });

  const { data: driversFieldedData, isLoading: driversFieldedLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'driversFielded'],
    queryFn: () => fetchTeamDriversFieldedLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-drivers-fielded',
  });

  const { data: dnfsData, isLoading: dnfsLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'dnfs'],
    queryFn: () => fetchTeamDnfLeaderboard(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'most-dnfs',
  });

  const { data: winStreaksData, isLoading: winStreaksLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'winStreaks'],
    queryFn: () => fetchTeamWinStreaks(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'longest-win-streaks',
  });

  const { data: podiumStreaksData, isLoading: podiumStreaksLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'podiumStreaks'],
    queryFn: () => fetchTeamPodiumStreaks(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'longest-podium-streaks',
  });

  const { data: pointsStreaksData, isLoading: pointsStreaksLoading } = useQuery({
    queryKey: ['teamLeaderboard-full', 'pointsStreaks'],
    queryFn: () => fetchTeamPointsStreaks(FETCH_LIMIT),
    staleTime: 1000 * 60 * 60,
    enabled: statSlug === 'longest-points-streaks',
  });

  const isLoading =
    winsLoading ||
    champsLoading ||
    podiumsLoading ||
    polesLoading ||
    pointsLoading ||
    entriesLoading ||
    seasonsLoading ||
    fastestLapsLoading ||
    winPctLoading ||
    podiumPctLoading ||
    avgFinishLoading ||
    oneTwoLoading ||
    pointsPerRaceLoading ||
    driversFieldedLoading ||
    dnfsLoading ||
    winStreaksLoading ||
    podiumStreaksLoading ||
    pointsStreaksLoading;

  // Get the right data for the current stat
  const currentLeaderboardData = useMemo(() => {
    const map: Record<string, LeaderboardTeam[] | undefined> = {
      "constructors'-championships": champsData,
      'most-race-wins': winsData,
      'most-podiums': podiumsData,
      'most-pole-positions': polesData,
      'most-career-points': pointsData,
      'most-race-entries': entriesData,
      'most-seasons-active': seasonsData,
    };
    return map[statDef.slug];
  }, [
    statDef.slug,
    champsData,
    winsData,
    podiumsData,
    polesData,
    pointsData,
    entriesData,
    seasonsData,
  ]);

  const currentStatData = useMemo(() => {
    const map: Record<string, TeamStatEntry[] | undefined> = {
      'most-fastest-laps': fastestLapsData,
      'best-win-%': winPctData,
      'best-podium-%': podiumPctData,
      'best-average-finish': avgFinishData,
      'most-1-2-finishes': oneTwoData,
      'points-per-race': pointsPerRaceData,
      'most-drivers-fielded': driversFieldedData,
      'most-dnfs': dnfsData,
    };
    return map[statDef.slug];
  }, [
    statDef.slug,
    fastestLapsData,
    winPctData,
    podiumPctData,
    avgFinishData,
    oneTwoData,
    pointsPerRaceData,
    driversFieldedData,
    dnfsData,
  ]);

  const currentStreakData = useMemo(() => {
    const map: Record<string, TeamStreakEntry[] | undefined> = {
      'longest-win-streaks': winStreaksData,
      'longest-podium-streaks': podiumStreaksData,
      'longest-points-streaks': pointsStreaksData,
    };
    return map[statDef.slug];
  }, [statDef.slug, winStreaksData, podiumStreaksData, pointsStreaksData]);

  // Normalize and filter data
  const rows = useMemo(() => {
    const raw = normalizeData(statDef, currentLeaderboardData, currentStatData, currentStreakData);

    let filtered = raw;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.name.toLowerCase().includes(q) || r.nationality.toLowerCase().includes(q)
      );
    }

    if (nationalityFilter !== 'All') {
      filtered = filtered.filter((r) => r.nationality === nationalityFilter);
    }

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
      <SEO title={`${statDef.title} — Constructor Leaderboard`} description={statDef.description} />

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teams"
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
              navigate(`/teams/leaderboard/${val}`);
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
            placeholder="Search constructors..."
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
        {isLoading ? 'Loading...' : `${rows.length} constructors`}
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
            Constructor
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
            No constructors found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {rows.map((row, i) => (
              <Link
                key={`${row.constructor_id}-${i}`}
                to={`/teams/${getTeamSlug(row.name)}`}
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

export default TeamLeaderboard;
