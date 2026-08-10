import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { fetchPitStopsDetail } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobilePitstopLeaderboard from '@/components/mobile/pages/MobilePitstopLeaderboard';

const ALL_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

const formatDuration = (seconds: number): string => {
  return seconds.toFixed(1);
};

const PitstopLeaderboard = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobilePitstopLeaderboard />;

  return <PitstopLeaderboardDesktop />;
};

const PitstopLeaderboardDesktop = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentSeasonYear());
  const [raceFilter, setRaceFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const { data: pitStops = [], isLoading } = useQuery({
    queryKey: ['pitStopsDetail', selectedYear],
    queryFn: () => fetchPitStopsDetail(selectedYear),
  });

  const raceOptions = useMemo(() => {
    const races = pitStops
      .map((s) => s.race)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
    return races;
  }, [pitStops]);

  const filtered = useMemo(() => {
    let result = pitStops;
    if (raceFilter !== 'all') {
      result = result.filter((s) => s.race?.toLowerCase().includes(raceFilter.toLowerCase()));
    }
    if (driverFilter !== 'all') {
      result = result.filter((s) => s.driver_acronym.toUpperCase() === driverFilter.toUpperCase());
    }
    if (teamFilter !== 'all') {
      result = result.filter((s) => s.team_name?.toLowerCase().includes(teamFilter.toLowerCase()));
    }
    return result;
  }, [pitStops, raceFilter, driverFilter, teamFilter]);

  const driverOptions = useMemo(() => {
    const drivers = pitStops
      .map((s) => s.driver_acronym)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return drivers;
  }, [pitStops]);

  const teamOptions = useMemo(() => {
    const teams = pitStops
      .map((s) => s.team_name)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    return teams;
  }, [pitStops]);

  return (
    <>
      <SEO title={`Pit Stop Leaderboard ${selectedYear}`} />

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>

        <m.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[20px] font-semibold tracking-tight text-white"
        >
          Pit Stop Leaderboard
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-0.5 text-[12px] text-white/50"
        >
          Every individual pit stop by season
        </m.p>
      </div>

      <div className="mb-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400/70">
        Data may be incomplete — accuracy depends on the upstream provider. For the most reliable
        pit stop data, refer to the official Formula 1 website.
      </div>

      {/* Filters */}
      <m.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-5 flex flex-wrap items-center gap-3"
      >
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => {
            setSelectedYear(Number(v));
            setRaceFilter('all');
            setDriverFilter('all');
            setTeamFilter('all');
          }}
        >
          <SelectTrigger className="w-[110px] border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent>
            {ALL_YEARS.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={raceFilter} onValueChange={setRaceFilter}>
          <SelectTrigger className="w-[200px] border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
            <SelectValue placeholder="All races" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All races</SelectItem>
            {raceOptions.map((race) => (
              <SelectItem key={race} value={race}>
                {race}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger className="w-[140px] border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
            <SelectValue placeholder="All drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All drivers</SelectItem>
            {driverOptions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-[180px] border-white/[0.08] bg-white/[0.02] text-[13px] text-white/80">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teamOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(raceFilter !== 'all' || driverFilter !== 'all' || teamFilter !== 'all') && (
          <button
            onClick={() => {
              setRaceFilter('all');
              setDriverFilter('all');
              setTeamFilter('all');
            }}
            className="rounded-md border border-white/[0.08] px-3 py-2 text-[12px] text-white/50 transition-colors hover:text-white"
          >
            Clear filters
          </button>
        )}
      </m.div>

      {/* Results count */}
      <div className="mb-3 text-[12px] text-white/40">
        {isLoading
          ? 'Loading...'
          : `${filtered.length} pit stop${filtered.length === 1 ? '' : 's'}`}
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
          <span className="w-[160px] shrink-0 text-[11px] font-medium uppercase tracking-wider text-white/30">
            Driver
          </span>
          <span className="flex-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
            Team
          </span>
          <span className="hidden flex-1 text-[11px] font-medium uppercase tracking-wider text-white/30 sm:block">
            Race
          </span>
          <span className="shrink-0 text-right text-[11px] font-medium uppercase tracking-wider text-white/30">
            Duration
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-white/[0.03]">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="h-4 w-5 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-4 w-20 animate-pulse rounded bg-white/[0.06]" />
                <div className="ml-auto h-4 w-12 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-white/40">
            No pit stops found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filtered.map((stop, i) => {
              const driverImage = getDriverImage(stop.driver_acronym, selectedYear);
              return (
                <div
                  key={`${stop.session_key}-${stop.driver_number}-${i}`}
                  className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="w-10 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30">
                    {i + 1}
                  </span>

                  <div className="flex w-[160px] shrink-0 items-center gap-2.5">
                    {driverImage && (
                      <img
                        src={driverImage}
                        alt={stop.driver_acronym}
                        className="size-6 rounded-full object-cover object-top"
                      />
                    )}
                    <span className="truncate text-[13px] font-medium text-white">
                      {stop.driver_acronym}
                    </span>
                  </div>

                  <span className="min-w-0 flex-1 truncate text-[13px] text-white/80">
                    {stop.team_name}
                  </span>

                  <span className="hidden min-w-0 flex-1 truncate text-[13px] text-white/60 sm:block">
                    {stop.race || stop.race_country}
                  </span>

                  <span className="w-24 shrink-0 text-right font-mono text-[13px] tabular-nums text-white">
                    {formatDuration(stop.stop_duration)}
                    <span className="ml-0.5 text-[11px] text-white/40">s</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </m.div>
    </>
  );
};

export default PitstopLeaderboard;
