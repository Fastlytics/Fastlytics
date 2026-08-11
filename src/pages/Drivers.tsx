import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  fetchDriverWinsLeaderboard,
  fetchDriverPodiumsLeaderboard,
  fetchDriverPolesLeaderboard,
  fetchDriverPointsLeaderboard,
  fetchDriverChampionshipsLeaderboard,
  fetchDriverWinStreaks,
  fetchDriverPodiumStreaks,
  fetchDriverWinPctLeaderboard,
  fetchDriverEntriesLeaderboard,
  fetchDriverDnfLeaderboard,
  fetchDriverFastestLapsLeaderboard,
  fetchDriverAvgFinishLeaderboard,
  fetchDriverSeasonsLeaderboard,
  fetchDriverStandings,
  LeaderboardDriver,
  DriverStatEntry,
  StreakEntry,
  DriverStanding,
} from '@/lib/api';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER, CARD_GAP } from '@/lib/card-styles';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { useSeason } from '@/contexts/SeasonContext';
import { getDriverImage } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getDriverSlug } from '@/lib/driverSlugs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/ui/PageLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileDrivers from '@/components/mobile/pages/MobileDrivers';

const TOP_N = 10;

const Drivers = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileDrivers />;
  return <DriversDesktop />;
};

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
// Leaderboard Table (LeaderboardDriver[] — existing RPC responses)
// ---------------------------------------------------------------------------

function LeaderboardTable({
  title,
  data,
  isLoading,
  columns,
  delay = 0,
}: {
  title: string;
  data: LeaderboardDriver[] | undefined;
  isLoading: boolean;
  columns: {
    key: string;
    label: string;
    format?: (v: unknown, row: LeaderboardDriver) => string;
  }[];
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
        <PageLoader size="sm" className="py-10" />
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows?.map((driver, i) => (
            <Link
              key={`${driver.driver_id}-${i}`}
              to={`/drivers/${driver.driver_id}`}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <span className="w-5 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                {i + 1}
              </span>

              <Flag nationality={driver.nationality} />

              <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                {driver.name}
              </span>

              {columns.map((col) => (
                <span
                  key={col.key}
                  className="shrink-0 font-mono text-[13px] tabular-nums text-white"
                >
                  {col.format
                    ? col.format((driver as unknown as Record<string, unknown>)[col.key], driver)
                    : String((driver as unknown as Record<string, unknown>)[col.key] ?? '')}
                </span>
              ))}
            </Link>
          ))}
        </div>
      )}

      <SeeAllLink to={`/drivers/leaderboard/${title.toLowerCase().replace(/\s+/g, '-')}`} />
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Stat Table (DriverStatEntry[] — generic value-based leaderboards)
// ---------------------------------------------------------------------------

function StatTable({
  title,
  data,
  isLoading,
  formatValue,
  delay = 0,
}: {
  title: string;
  data: DriverStatEntry[] | undefined;
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
        <PageLoader size="sm" className="py-10" />
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows?.map((entry, i) => (
            <Link
              key={`${entry.driver_id}-${i}`}
              to={`/drivers/${entry.driver_id}`}
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

      <SeeAllLink to={`/drivers/leaderboard/${title.toLowerCase().replace(/\s+/g, '-')}`} />
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
  data: StreakEntry[] | undefined;
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
        <PageLoader size="sm" className="py-10" />
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {data?.map((entry, i) => (
            <Link
              key={`${entry.driver_id}-${i}`}
              to={`/drivers/${entry.driver_id}`}
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

      <SeeAllLink to={`/drivers/leaderboard/${title.toLowerCase().replace(/\s+/g, '-')}`} />
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Legends Data
// ---------------------------------------------------------------------------

interface LegendDriver {
  /** Must match the driver_id returned by the leaderboard API (Ergast reference) */
  id: string;
  name: string;
  nationality: string;
  era: string;
  image: string;
  slug: string;
}

const LEGENDS: LegendDriver[] = [
  {
    id: 'michael_schumacher',
    name: 'Michael Schumacher',
    nationality: 'German',
    era: '1991–2012',
    image: '/legends/schumacher.png',
    slug: 'michael_schumacher',
  },
  {
    id: 'senna',
    name: 'Ayrton Senna',
    nationality: 'Brazilian',
    era: '1984–1994',
    image: '/legends/senna.png',
    slug: 'senna',
  },
  {
    id: 'prost',
    name: 'Alain Prost',
    nationality: 'French',
    era: '1980–1993',
    image: '/legends/prost.png',
    slug: 'prost',
  },
  {
    id: 'fangio',
    name: 'Juan Manuel Fangio',
    nationality: 'Argentine',
    era: '1950–1958',
    image: '/legends/fangio.png',
    slug: 'fangio',
  },
  {
    id: 'lauda',
    name: 'Niki Lauda',
    nationality: 'Austrian',
    era: '1971–1985',
    image: '/legends/lauda.png',
    slug: 'lauda',
  },
  {
    id: 'clark',
    name: 'Jim Clark',
    nationality: 'British',
    era: '1960–1968',
    image: '/legends/clark.png',
    slug: 'clark',
  },
  {
    id: 'hamilton',
    name: 'Lewis Hamilton',
    nationality: 'British',
    era: '2007–present',
    image: '/legends/hamilton.png',
    slug: 'hamilton',
  },
  {
    id: 'vettel',
    name: 'Sebastian Vettel',
    nationality: 'German',
    era: '2007–2022',
    image: '/legends/vettel.png',
    slug: 'vettel',
  },
  {
    id: 'max_verstappen',
    name: 'Max Verstappen',
    nationality: 'Dutch',
    era: '2015–present',
    image: '/legends/verstappen.png',
    slug: 'max_verstappen',
  },
];

/** 1 week in ms — used as staleTime for legend stats queries */
const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

/** Driver codes/IDs that appear in the Legends section — excluded from Active */
const LEGEND_CODES = new Set(['HAM', 'VET', 'VER']);

// ---------------------------------------------------------------------------
// Legend Card
// ---------------------------------------------------------------------------

function LegendCard({
  legend,
  wins,
  titles,
  delay = 0,
}: {
  legend: LegendDriver;
  wins: number | null;
  titles: number | null;
  delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="relative hover:z-10"
    >
      <Link
        to={`/drivers/${legend.slug}`}
        className={cn(
          CARD_CONTAINER,
          'group relative block',
          'hover:border-white/[0.08] focus-visible:outline-none focus-visible:border-white/[0.12]'
        )}
      >
        {/* Gold accent strip for legends */}
        <div className="absolute left-0 top-0 h-[2px] w-full bg-amber-500/60" aria-hidden />

        <div className="flex">
          {/* Left: info */}
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
            {/* Nationality flag + era */}
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/${getNationalityCountryCode(legend.nationality)}.svg`}
                alt={legend.nationality}
                className="h-3 w-auto rounded-sm opacity-70"
              />
              <span className="text-[11px] text-white/40">{legend.era}</span>
            </div>

            {/* Name */}
            <h3 className="truncate text-[16px] font-medium tracking-[-0.01em] text-white">
              {legend.name}
            </h3>

            {/* Stats row */}
            <div className="flex items-center gap-3 border-t border-white/[0.04] pt-3 font-mono text-[12px] tabular-nums text-white/80">
              {titles !== null ? (
                <>
                  <span>
                    <span className="text-amber-400">{titles}</span>
                    <span className="ml-0.5 text-white/50">×WDC</span>
                  </span>
                  <span className="text-white/20">·</span>
                </>
              ) : null}
              {wins !== null ? (
                <span>
                  <span className="text-white">{wins}</span>
                  <span className="ml-0.5 text-white/50">wins</span>
                </span>
              ) : (
                <span className="h-3.5 w-12 animate-pulse rounded bg-white/[0.06]" />
              )}
            </div>
          </div>

          {/* Right: portrait */}
          <div className="relative w-[96px] shrink-0 overflow-hidden border-l border-white/[0.04] transition-[overflow] duration-0 group-hover:overflow-visible">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                background: 'linear-gradient(to top, rgb(245 158 11), transparent 70%)',
              }}
              aria-hidden
            />
            {legend.image ? (
              <img
                src={legend.image}
                alt=""
                className="absolute inset-0 size-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.15] group-hover:-translate-y-1"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-mono text-[14px] font-medium text-white/40">
                  {legend.name.split(' ').pop()?.slice(0, 3).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Active Driver Card
// ---------------------------------------------------------------------------

function ActiveDriverCard({
  driver,
  year,
  delay = 0,
}: {
  driver: DriverStanding;
  year: number;
  delay?: number;
}) {
  const colorClass = getTeamColorClass(driver.team);
  const driverImage = getDriverImage(driver.code, year);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Link
        to={`/drivers/${getDriverSlug(driver.code, driver.name)}`}
        className={cn(
          CARD_CONTAINER,
          'group relative block overflow-hidden transition-colors',
          'hover:border-white/[0.08] focus-visible:outline-none focus-visible:border-white/[0.12]'
        )}
      >
        {/* Team color accent strip */}
        <div
          className={cn('absolute left-0 top-0 h-[2px] w-full', `bg-f1-${colorClass}`)}
          aria-hidden
        />

        <div className="flex">
          {/* Left: info */}
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
            {/* Team */}
            <div className="flex items-center gap-2 text-[12px] text-white/60">
              <span className={cn('size-1.5 rounded-full', `bg-f1-${colorClass}`)} aria-hidden />
              <span className="truncate">{driver.team}</span>
            </div>

            {/* Name */}
            <h3 className="truncate text-[16px] font-medium tracking-[-0.01em] text-white">
              {driver.name}
            </h3>

            {/* Stats row */}
            <div className="flex items-center gap-3 border-t border-white/[0.04] pt-3 font-mono text-[12px] tabular-nums text-white/80">
              <span>
                <span className="text-white">{driver.points}</span>
                <span className="ml-0.5 text-white/50">pts</span>
              </span>
              <span className="text-white/20">·</span>
              <span>
                <span className="text-white">{driver.wins}</span>
                <span className="ml-0.5 text-white/50">W</span>
              </span>
              <span className="text-white/20">·</span>
              <span>
                <span className="text-white">{driver.podiums}</span>
                <span className="ml-0.5 text-white/50">P</span>
              </span>
            </div>
          </div>

          {/* Right: portrait */}
          <div className="relative w-[96px] shrink-0 border-l border-white/[0.04]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                background: `linear-gradient(to top, var(--color-f1-${colorClass}), transparent 70%)`,
              }}
              aria-hidden
            />
            {driverImage ? (
              <Avatar className="absolute inset-0 size-full rounded-none border-0 transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                <AvatarImage src={driverImage} alt="" className="object-cover object-top" />
                <AvatarFallback className="rounded-none bg-transparent font-mono text-[14px] font-medium text-white/40">
                  {driver.code}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-mono text-[14px] font-medium text-white/40">
                  {driver.code}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const DriversDesktop = () => {
  const { selectedYear } = useSeason();

  // Fetch active drivers from current season standings
  const { data: activeDrivers, isLoading: activeLoading } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
    staleTime: 1000 * 60 * 60,
  });

  // Filter out legend drivers from active list
  const filteredActiveDrivers = activeDrivers?.filter((driver) => !LEGEND_CODES.has(driver.code));

  // Fetch legend stats — larger limit to ensure all legends appear, 1 week cache
  const { data: legendWinsData } = useQuery({
    queryKey: ['leaderboard', 'wins', 'legends'],
    queryFn: () => fetchDriverWinsLeaderboard(100),
    staleTime: ONE_WEEK_MS,
  });

  const { data: legendChampsData } = useQuery({
    queryKey: ['leaderboard', 'championships', 'legends'],
    queryFn: () => fetchDriverChampionshipsLeaderboard(100),
    staleTime: ONE_WEEK_MS,
  });

  // Build lookup maps: driver_id → stat value
  const winsMap = useMemo(() => {
    if (!legendWinsData) return new Map<string, number>();
    return new Map(legendWinsData.map((d) => [d.driver_id, d.total_wins ?? 0]));
  }, [legendWinsData]);

  const champsMap = useMemo(() => {
    if (!legendChampsData) return new Map<string, number>();
    return new Map(legendChampsData.map((d) => [d.driver_id, d.championships ?? 0]));
  }, [legendChampsData]);

  const { data: wins, isLoading: winsLoading } = useQuery({
    queryKey: ['leaderboard', 'wins'],
    queryFn: () => fetchDriverWinsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: podiums, isLoading: podiumsLoading } = useQuery({
    queryKey: ['leaderboard', 'podiums'],
    queryFn: () => fetchDriverPodiumsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: poles, isLoading: polesLoading } = useQuery({
    queryKey: ['leaderboard', 'poles'],
    queryFn: () => fetchDriverPolesLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['leaderboard', 'points'],
    queryFn: () => fetchDriverPointsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: championships, isLoading: champsLoading } = useQuery({
    queryKey: ['leaderboard', 'championships'],
    queryFn: () => fetchDriverChampionshipsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: winStreaks, isLoading: winStreaksLoading } = useQuery({
    queryKey: ['leaderboard', 'winStreaks'],
    queryFn: () => fetchDriverWinStreaks(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: podiumStreaks, isLoading: podiumStreaksLoading } = useQuery({
    queryKey: ['leaderboard', 'podiumStreaks'],
    queryFn: () => fetchDriverPodiumStreaks(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: winPct, isLoading: winPctLoading } = useQuery({
    queryKey: ['leaderboard', 'winPct'],
    queryFn: () => fetchDriverWinPctLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['leaderboard', 'entries'],
    queryFn: () => fetchDriverEntriesLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: dnfs, isLoading: dnfsLoading } = useQuery({
    queryKey: ['leaderboard', 'dnfs'],
    queryFn: () => fetchDriverDnfLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: fastestLaps, isLoading: fastestLapsLoading } = useQuery({
    queryKey: ['leaderboard', 'fastestLaps'],
    queryFn: () => fetchDriverFastestLapsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: avgFinish, isLoading: avgFinishLoading } = useQuery({
    queryKey: ['leaderboard', 'avgFinish'],
    queryFn: () => fetchDriverAvgFinishLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['leaderboard', 'seasons'],
    queryFn: () => fetchDriverSeasonsLeaderboard(TOP_N),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <>
      <SEO
        title="Drivers"
        description="Explore all-time F1 driver records: most wins, podiums, poles, championships, and longest streaks since 1950."
      />

      <div className="mb-8">
        <m.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[20px] font-semibold tracking-tight text-white"
        >
          All-Time Driver Records
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-0.5 text-[12px] text-white/50"
        >
          75 years of Formula 1 — every win, podium, pole, and championship since 1950
        </m.p>
      </div>

      {/* Legends Section */}
      <div className="mb-10">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-4"
        >
          <h2 className="text-[15px] font-semibold text-white">Legends</h2>
          <p className="mt-0.5 text-[12px] text-white/40">The greatest to ever race in Formula 1</p>
        </m.div>

        <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
          {LEGENDS.map((legend, i) => (
            <LegendCard
              key={legend.id}
              legend={legend}
              wins={winsMap.get(legend.id) ?? null}
              titles={champsMap.get(legend.id) ?? null}
              delay={i * 0.03}
            />
          ))}
        </div>
      </div>

      {/* Active Drivers Section */}
      <div className="mb-10">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-4"
        >
          <h2 className="text-[15px] font-semibold text-white">Active Drivers — {selectedYear}</h2>
          <p className="mt-0.5 text-[12px] text-white/40">
            Current season grid sorted by championship position
          </p>
        </m.div>

        {activeLoading ? (
          <PageLoader message="Loading active drivers…" />
        ) : filteredActiveDrivers && filteredActiveDrivers.length > 0 ? (
          <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
            {filteredActiveDrivers.map((driver, i) => (
              <ActiveDriverCard
                key={driver.code}
                driver={driver}
                year={selectedYear}
                delay={Math.min(i * 0.02, 0.3)}
              />
            ))}
          </div>
        ) : (
          <div className={`${CARD_CONTAINER} px-5 py-8 text-center`}>
            <p className="text-[13px] text-white/50">No active driver data for {selectedYear}.</p>
          </div>
        )}
      </div>

      {/* Divider before leaderboards */}
      <div className="mb-8 border-t border-white/[0.04] pt-8">
        <m.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-[15px] font-semibold text-white"
        >
          All-Time Leaderboards
        </m.h2>
        <p className="mt-0.5 text-[12px] text-white/40">
          Career records across every era of the sport
        </p>
      </div>

      {/* Championships + Wins */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LeaderboardTable
          title="World Championships"
          data={championships}
          isLoading={champsLoading}
          columns={[{ key: 'championships', label: 'Titles', format: (v) => `${v}×` }]}
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
            { key: 'total_points', label: 'Points', format: (v) => Number(v).toLocaleString() },
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

      {/* Win % + Avg Finish */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable
          title="Best Win %"
          data={winPct}
          isLoading={winPctLoading}
          formatValue={(v) => `${v}%`}
          delay={0.3}
        />

        <StatTable
          title="Best Average Finish"
          data={avgFinish}
          isLoading={avgFinishLoading}
          formatValue={(v) => `P${v.toFixed(2)}`}
          delay={0.35}
        />
      </div>

      {/* Entries + Seasons */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable
          title="Most Race Entries"
          data={entries}
          isLoading={entriesLoading}
          delay={0.4}
        />

        <StatTable
          title="Most Seasons Driven"
          data={seasons}
          isLoading={seasonsLoading}
          delay={0.45}
        />
      </div>

      {/* DNFs + Streaks row */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatTable title="Most DNFs" data={dnfs} isLoading={dnfsLoading} delay={0.5} />

        <StreakTable
          title="Longest Win Streaks"
          data={winStreaks}
          isLoading={winStreaksLoading}
          delay={0.55}
        />
      </div>

      {/* Podium streaks */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StreakTable
          title="Longest Podium Streaks"
          data={podiumStreaks}
          isLoading={podiumStreaksLoading}
          delay={0.6}
        />
      </div>
    </>
  );
};

export default Drivers;
