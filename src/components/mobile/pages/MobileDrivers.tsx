import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
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
import { CARD_CONTAINER } from '@/lib/card-styles';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { useSeason } from '@/contexts/SeasonContext';
import { getDriverImage } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getDriverSlug } from '@/lib/driverSlugs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';

const TOP_N = 10;

interface LegendDriver {
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

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;
const LEGEND_CODES = new Set(['HAM', 'VET', 'VER']);

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

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-white">{title}</h2>
      <p className="mt-0.5 text-[12px] text-white/40">{subtitle}</p>
    </div>
  );
}

function SeeAllLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center gap-1 border-t border-white/[0.04] px-5 py-3 text-[12px] font-medium text-white/40 transition-colors active:text-white/70"
    >
      See all
      <span className="text-white/30">→</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard Table (LeaderboardDriver[])
// ---------------------------------------------------------------------------

function LeaderboardTable({
  title,
  data,
  isLoading,
  columns,
}: {
  title: string;
  data: LeaderboardDriver[] | undefined;
  isLoading: boolean;
  columns: {
    key: string;
    label: string;
    format?: (v: unknown, row: LeaderboardDriver) => string;
  }[];
}) {
  const rows = data?.slice(0, TOP_N);

  return (
    <div className={`${CARD_CONTAINER} overflow-hidden`}>
      <div className="border-b border-white/[0.04] px-4 py-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-white/50">{title}</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows?.map((driver, i) => (
            <Link
              key={`${driver.driver_id}-${i}`}
              to={`/drivers/${driver.driver_id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/[0.03]"
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Table (DriverStatEntry[])
// ---------------------------------------------------------------------------

function StatTable({
  title,
  data,
  isLoading,
  formatValue,
}: {
  title: string;
  data: DriverStatEntry[] | undefined;
  isLoading: boolean;
  formatValue?: (v: number) => string;
}) {
  const rows = data?.slice(0, TOP_N);

  return (
    <div className={`${CARD_CONTAINER} overflow-hidden`}>
      <div className="border-b border-white/[0.04] px-4 py-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-white/50">{title}</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {rows?.map((entry, i) => (
            <Link
              key={`${entry.driver_id}-${i}`}
              to={`/drivers/${entry.driver_id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/[0.03]"
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streak Table
// ---------------------------------------------------------------------------

function StreakTable({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: StreakEntry[] | undefined;
  isLoading: boolean;
}) {
  return (
    <div className={`${CARD_CONTAINER} overflow-hidden`}>
      <div className="border-b border-white/[0.04] px-4 py-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-white/50">{title}</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {data?.map((entry, i) => (
            <Link
              key={`${entry.driver_id}-${i}`}
              to={`/drivers/${entry.driver_id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/[0.03]"
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Driver Card
// ---------------------------------------------------------------------------

function ActiveDriverCard({ driver, year }: { driver: DriverStanding; year: number }) {
  const colorClass = getTeamColorClass(driver.team);
  const driverImage = getDriverImage(driver.code, year);

  return (
    <Link
      to={`/drivers/${getDriverSlug(driver.code, driver.name)}`}
      className={cn(CARD_CONTAINER, 'relative block overflow-hidden active:scale-[0.98]')}
    >
      <div
        className={cn('absolute left-0 top-0 h-[2px] w-full', `bg-f1-${colorClass}`)}
        aria-hidden
      />

      <div className="flex">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-[12px] text-white/60">
            <span className={cn('size-1.5 rounded-full', `bg-f1-${colorClass}`)} aria-hidden />
            <span className="truncate">{driver.team}</span>
          </div>

          <h3 className="truncate text-[16px] font-medium tracking-[-0.01em] text-white">
            {driver.name}
          </h3>

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

        <div className="relative w-[96px] shrink-0 border-l border-white/[0.04]">
          {driverImage ? (
            <Avatar className="absolute inset-0 size-full rounded-none border-0">
              <AvatarImage src={driverImage} alt="" className="object-cover object-top" />
              <AvatarFallback className="rounded-none bg-transparent font-mono text-[14px] font-medium text-white/40">
                {driver.code}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-mono text-[14px] font-medium text-white/40">{driver.code}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function MobileDrivers() {
  const { selectedYear } = useSeason();

  const { data: activeDrivers, isLoading: activeLoading } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
    staleTime: 1000 * 60 * 60,
  });

  const filteredActiveDrivers = activeDrivers?.filter((driver) => !LEGEND_CODES.has(driver.code));

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sticky logo header */}
      <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pt-3 pb-2 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      <div className="space-y-6 px-4 pt-4 pb-24">
        {/* Title */}
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.01em] text-white">Drivers</h1>
          <p className="mt-0.5 text-[12px] text-white/40">
            Every win, podium, pole, and championship since 1950
          </p>
        </div>

        {/* Legends */}
        <div className="space-y-3">
          <SectionTitle title="Legends" subtitle="The greatest to ever race in Formula 1" />
          {LEGENDS.map((legend, i) => {
            const wins = winsMap.get(legend.id) ?? null;
            const titles = champsMap.get(legend.id) ?? null;
            return (
              <m.div
                key={legend.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.2) }}
              >
                <Link
                  to={`/drivers/${legend.slug}`}
                  className={cn(
                    CARD_CONTAINER,
                    'relative block overflow-hidden active:scale-[0.98]'
                  )}
                >
                  <div
                    className="absolute left-0 top-0 h-[2px] w-full bg-amber-500/60"
                    aria-hidden
                  />
                  <div className="flex">
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/${getNationalityCountryCode(legend.nationality)}.svg`}
                          alt={legend.nationality}
                          className="h-3 w-auto rounded-sm opacity-70"
                        />
                        <span className="text-[11px] text-white/40">{legend.era}</span>
                      </div>
                      <h3 className="truncate text-[16px] font-medium tracking-[-0.01em] text-white">
                        {legend.name}
                      </h3>
                      <div className="flex items-center gap-3 border-t border-white/[0.04] pt-3 font-mono text-[12px] tabular-nums text-white/80">
                        {titles !== null && (
                          <>
                            <span>
                              <span className="text-amber-400">{titles}</span>
                              <span className="ml-0.5 text-white/50">×WDC</span>
                            </span>
                            <span className="text-white/20">·</span>
                          </>
                        )}
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
                    <div className="relative w-[96px] shrink-0 overflow-hidden border-l border-white/[0.04]">
                      {legend.image ? (
                        <img
                          src={legend.image}
                          alt=""
                          className="absolute inset-0 size-full object-cover object-top"
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
          })}
        </div>

        {/* Active drivers */}
        <div className="space-y-3">
          <SectionTitle
            title={`Active Drivers — ${selectedYear}`}
            subtitle="Current season grid sorted by championship position"
          />
          {activeLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${CARD_CONTAINER} h-24 animate-pulse`} />
              ))}
            </div>
          ) : filteredActiveDrivers && filteredActiveDrivers.length > 0 ? (
            <div className="space-y-3">
              {filteredActiveDrivers.map((driver, i) => (
                <m.div
                  key={driver.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.2) }}
                >
                  <ActiveDriverCard driver={driver} year={selectedYear} />
                </m.div>
              ))}
            </div>
          ) : (
            <div className={`${CARD_CONTAINER} px-5 py-8 text-center`}>
              <p className="text-[13px] text-white/50">No active driver data for {selectedYear}.</p>
            </div>
          )}
        </div>

        {/* All-time leaderboards */}
        <div className="space-y-3">
          <SectionTitle
            title="All-Time Leaderboards"
            subtitle="Career records across every era of the sport"
          />
          <LeaderboardTable
            title="World Championships"
            data={championships}
            isLoading={champsLoading}
            columns={[{ key: 'championships', label: 'Titles', format: (v) => `${v}×` }]}
          />
          <LeaderboardTable
            title="Most Race Wins"
            data={wins}
            isLoading={winsLoading}
            columns={[{ key: 'total_wins', label: 'Wins' }]}
          />
          <LeaderboardTable
            title="Most Podiums"
            data={podiums}
            isLoading={podiumsLoading}
            columns={[{ key: 'total_podiums', label: 'Podiums' }]}
          />
          <LeaderboardTable
            title="Most Pole Positions"
            data={poles}
            isLoading={polesLoading}
            columns={[{ key: 'total_poles', label: 'Poles' }]}
          />
          <LeaderboardTable
            title="Most Career Points"
            data={points}
            isLoading={pointsLoading}
            columns={[
              { key: 'total_points', label: 'Points', format: (v) => Number(v).toLocaleString() },
            ]}
          />
          <StatTable
            title="Most Fastest Laps"
            data={fastestLaps}
            isLoading={fastestLapsLoading}
            formatValue={(v) => String(v)}
          />
          <StatTable
            title="Best Win %"
            data={winPct}
            isLoading={winPctLoading}
            formatValue={(v) => `${v}%`}
          />
          <StatTable
            title="Best Average Finish"
            data={avgFinish}
            isLoading={avgFinishLoading}
            formatValue={(v) => `P${v.toFixed(2)}`}
          />
          <StatTable title="Most Race Entries" data={entries} isLoading={entriesLoading} />
          <StatTable title="Most Seasons Driven" data={seasons} isLoading={seasonsLoading} />
          <StatTable title="Most DNFs" data={dnfs} isLoading={dnfsLoading} />
          <StreakTable
            title="Longest Win Streaks"
            data={winStreaks}
            isLoading={winStreaksLoading}
          />
          <StreakTable
            title="Longest Podium Streaks"
            data={podiumStreaks}
            isLoading={podiumStreaksLoading}
          />
        </div>
      </div>
    </div>
  );
}
