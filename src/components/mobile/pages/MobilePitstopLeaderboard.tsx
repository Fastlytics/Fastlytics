import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { fetchPitStopsDetail } from '@/lib/api';
import type { PitStopRecord } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { cn } from '@/lib/utils';

const ALL_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

const formatDuration = (seconds: number): string => {
  return seconds.toFixed(1);
};

const MobilePitstopLeaderboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(getCurrentSeasonYear());
  const [raceFilter, setRaceFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { data: pitStops = [], isLoading } = useQuery({
    queryKey: ['pitStopsDetail', selectedYear],
    queryFn: () => fetchPitStopsDetail(selectedYear),
  });

  const raceOptions = useMemo(() => {
    return pitStops
      .map((s) => s.race)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [pitStops]);

  const driverOptions = useMemo(() => {
    return pitStops
      .map((s) => s.driver_acronym)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [pitStops]);

  const teamOptions = useMemo(() => {
    return pitStops
      .map((s) => s.team_name)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
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

  const activeFilterCount = [raceFilter, driverFilter, teamFilter].filter(
    (f) => f !== 'all'
  ).length;

  const clearFilters = () => {
    setRaceFilter('all');
    setDriverFilter('all');
    setTeamFilter('all');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sticky Logo Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm pt-3 px-4 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center justify-center">
          <FastlyticsLogo size={22} />
        </div>
      </div>

      {/* Year Selector */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {ALL_YEARS.map((year) => (
            <button
              key={year}
              onClick={() => {
                setSelectedYear(year);
                setRaceFilter('all');
                setDriverFilter('all');
                setTeamFilter('all');
              }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all active:scale-[0.98]',
                selectedYear === year
                  ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                  : 'bg-transparent text-white/40 border border-white/[0.04] hover:text-white/60'
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Warning Banner */}
      <div className="mx-4 mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400/70">
        Data may be incomplete — accuracy depends on the upstream provider.
      </div>

      {/* Filter Toggle & Summary */}
      <div className="px-4 mt-3 flex items-center gap-2">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium transition-all active:scale-[0.98]',
            filtersExpanded
              ? 'border-white/[0.12] bg-white/[0.06] text-white'
              : 'border-white/[0.04] bg-white/[0.02] text-white/60 hover:text-white/80'
          )}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#ff0000] text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg border border-white/[0.04] text-[12px] text-white/40 hover:text-white/60 transition-colors active:scale-[0.98]"
          >
            Clear all
          </button>
        )}

        <div className="flex-1" />

        <span className="text-[12px] text-white/40">
          {isLoading ? 'Loading...' : `${filtered.length} stop${filtered.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Collapsible Filter Section */}
      <AnimatePresence>
        {filtersExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 space-y-3">
              {/* Driver Filter Pills */}
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-white/30 mb-2">
                  Driver
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setDriverFilter('all')}
                    className={cn(
                      'flex-shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.98]',
                      driverFilter === 'all'
                        ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                        : 'text-white/40 border border-white/[0.04] hover:text-white/60'
                    )}
                  >
                    All
                  </button>
                  {driverOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDriverFilter(d)}
                      className={cn(
                        'flex-shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.98]',
                        driverFilter === d
                          ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                          : 'text-white/40 border border-white/[0.04] hover:text-white/60'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Filter Pills */}
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-white/30 mb-2">
                  Team
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setTeamFilter('all')}
                    className={cn(
                      'flex-shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.98]',
                      teamFilter === 'all'
                        ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                        : 'text-white/40 border border-white/[0.04] hover:text-white/60'
                    )}
                  >
                    All
                  </button>
                  {teamOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTeamFilter(t)}
                      className={cn(
                        'flex-shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.98]',
                        teamFilter === t
                          ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                          : 'text-white/40 border border-white/[0.04] hover:text-white/60'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Race Filter Pills */}
              <div>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-white/30 mb-2">
                  Race
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setRaceFilter('all')}
                    className={cn(
                      'flex-shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.98]',
                      raceFilter === 'all'
                        ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                        : 'text-white/40 border border-white/[0.04] hover:text-white/60'
                    )}
                  >
                    All
                  </button>
                  {raceOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRaceFilter(r)}
                      className={cn(
                        'flex-shrink-0 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all active:scale-[0.98]',
                        raceFilter === r
                          ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                          : 'text-white/40 border border-white/[0.04] hover:text-white/60'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pit Stop Cards */}
      <div className="px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-white/[0.04] bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-white/[0.04] bg-white/[0.015]">
            <p className="text-[13px] font-medium text-white/40">
              No pit stops found matching your filters.
            </p>
          </div>
        ) : (
          filtered.map((stop, i) => {
            const driverImage = getDriverImage(stop.driver_acronym, selectedYear);
            return (
              <motion.div
                key={`${stop.session_key}-${stop.driver_number}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.4) }}
                className="relative rounded-lg border border-white/[0.04] bg-[#0a0a0a] overflow-hidden active:scale-[0.98] transition-transform"
              >
                {/* Team colour accent */}
                {stop.team_colour && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: `#${stop.team_colour}` }}
                  />
                )}

                <div className="flex items-center gap-3 p-3 pl-4">
                  {/* Position */}
                  <span className="w-7 shrink-0 text-right font-mono text-[12px] tabular-nums text-white/30 font-medium">
                    {i + 1}
                  </span>

                  {/* Driver Avatar */}
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/[0.04] bg-white/[0.03]">
                    {driverImage ? (
                      <img
                        src={driverImage}
                        alt={stop.driver_acronym}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-[13px] font-bold text-white/40">
                        {stop.driver_acronym}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-medium text-white truncate">
                        {stop.driver_acronym}
                      </span>
                      <span className="text-[11px] text-white/40 font-medium">
                        P{stop.driver_number}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/40 font-medium truncate">
                      {stop.team_name}
                    </div>
                    <div className="text-[11px] text-white/30 truncate">
                      {stop.race || stop.race_country}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="shrink-0 text-right">
                    <span className="font-mono text-[15px] font-medium tabular-nums text-white">
                      {formatDuration(stop.stop_duration)}
                    </span>
                    <span className="ml-0.5 text-[11px] text-white/40 font-medium">s</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export { MobilePitstopLeaderboard };
export default MobilePitstopLeaderboard;
