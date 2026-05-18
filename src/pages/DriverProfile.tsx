// knip-ignore
import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import {
  fetchDriverCareer,
  fetchDriverBio,
  fetchDriverStandings,
  fetchSchedule,
  fetchRaceResults,
  DriverCareer,
  DriverStanding,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { getDriverImage, getDriverImagesByCode } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { isTestingEvent } from '@/lib/standingsUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { DriverHero } from '@/pages/Driver/DriverHero';
import { DriverTabStrip } from '@/pages/Driver/DriverTabStrip';
import { DriverChampionshipSection } from '@/pages/Driver/DriverChampionshipSection';
import { PageLoader } from '@/components/ui/PageLoader';

const DriverProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedYear } = useSeason();
  const [selectedImageYear, setSelectedImageYear] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const {
    data: career,
    isLoading,
    isError,
    error,
  } = useQuery<DriverCareer>({
    queryKey: ['driverCareer', slug],
    queryFn: () => fetchDriverCareer(slug!),
    enabled: !!slug,
  });

  const { data: bio, isLoading: isBioLoading } = useQuery({
    queryKey: ['driverBio', slug],
    queryFn: () => fetchDriverBio(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const driverCode = career?.code || '';

  // Filter local images to only years the driver actually raced
  // (prevents e.g. Michael Schumacher showing Mick's 2021/2022 images since both share "MSC")
  const activeYears = useMemo(() => {
    if (!career) return new Set<number>();
    return new Set(career.seasons.map((s) => s.season));
  }, [career]);

  const availableImages = useMemo(() => {
    if (!driverCode) return [];
    return getDriverImagesByCode(driverCode).filter((img) => activeYears.has(img.year));
  }, [driverCode, activeYears]);

  const currentImageUrl = useMemo(() => {
    if (selectedImageYear) return getDriverImage(driverCode, selectedImageYear);
    const latest = availableImages[0];
    return latest?.url || getDriverImage(driverCode, selectedYear);
  }, [driverCode, selectedImageYear, availableImages, selectedYear]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // --- Championship status for the current season ---
  const currentYear = new Date().getFullYear();
  const isActiveInCurrentSeason = career?.seasons[0]?.season === currentYear;

  const { data: driverStandings } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', currentYear],
    queryFn: () => fetchDriverStandings(currentYear),
    enabled: !!career && isActiveInCurrentSeason,
    staleTime: 1000 * 60 * 10,
  });

  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', currentYear],
    queryFn: () => fetchSchedule(currentYear),
    enabled: !!career && isActiveInCurrentSeason,
    staleTime: 1000 * 60 * 60,
  });

  const [now] = useState(() => Date.now());
  const hasCompletedRaces = useMemo(
    () =>
      (schedule ?? []).some(
        (event) => !isTestingEvent(event) && new Date(event.EventDate).getTime() <= now
      ),
    [schedule, now]
  );

  const { data: raceResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', currentYear],
    queryFn: () => fetchRaceResults(currentYear),
    enabled: !!career && isActiveInCurrentSeason && hasCompletedRaces,
    staleTime: 1000 * 60 * 10,
  });

  const isCurrentSeasonChampion = useMemo(() => {
    if (!driverStandings || driverStandings.length < 2 || !schedule || !raceResults) return false;
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'driver', currentYear);
    return (
      getChampionshipStatus(
        driverStandings[0].points,
        driverStandings[1].points,
        remainingPoints
      ) === 'champion'
    );
  }, [driverStandings, schedule, raceResults, currentYear]);

  // Loading state
  if (isLoading) {
    return <PageLoader fullPage message="Loading driver profile…" />;
  }

  // Error state
  if (isError || !career) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        <m.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(CARD_CONTAINER, 'px-12 py-16 text-center')}
        >
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-red-400/20 bg-red-400/[0.05]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-red-400"
            >
              <path
                d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-[16px] font-semibold text-white">Driver Not Found</h3>
          <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-white/40">
            {(error as Error)?.message ||
              `No data available for "${slug}". Check the URL or try another driver.`}
          </p>
        </m.div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <SEO
        title={`${career.name} — Driver Profile`}
        description={`Career stats, season history, and analytics for ${career.name}. ${career.careerSummary.wins} wins, ${career.careerSummary.podiums} podiums across ${career.careerSummary.seasons} seasons.`}
      />

      <div className="space-y-5">
        {/* Hero */}
        <DriverHero
          career={career}
          bio={bio}
          isBioLoading={isBioLoading}
          currentImageUrl={currentImageUrl}
          fallbackImageUrl={slug ? `/api/driver/${encodeURIComponent(slug)}/image` : undefined}
          availableImages={availableImages}
          selectedImageYear={selectedImageYear}
          setSelectedImageYear={setSelectedImageYear}
          isCurrentSeasonChampion={isCurrentSeasonChampion}
        />

        {/* Tab Strip — full width, matching Race.tsx */}
        <DriverTabStrip activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <m.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewSection career={career} selectedYear={selectedYear} />
            )}
            {activeTab === 'championship' && (
              <DriverChampionshipSection career={career} slug={slug!} />
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Overview: Season-by-Season Table ─── */
function OverviewSection({ career, selectedYear }: { career: DriverCareer; selectedYear: number }) {
  const rookieSeason = career.seasons.length
    ? career.seasons[career.seasons.length - 1]?.season
    : null;

  return (
    <div className="space-y-5">
      {/* Season table */}
      <div className={CARD_CONTAINER}>
        <div className="px-5 pt-5 pb-3">
          <span className={CARD_LABEL}>Career Overview</span>
        </div>
        <div className="border-t border-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Season</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Team</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Races</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Wins</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Podiums</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Poles</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">FL</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">Points</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-white/80">WDC</th>
                </tr>
              </thead>
              <tbody>
                {career.seasons.map((season, i) => {
                  const isCurrent = season.season === selectedYear;
                  const isChampion = season.position === 1;
                  const isRookie = season.season === rookieSeason;

                  return (
                    <tr
                      key={season.season}
                      className={cn(
                        'border-b border-white/[0.02] transition-colors hover:bg-white/[0.02]',
                        isCurrent && 'bg-white/[0.03]',
                        isChampion && !isCurrent && 'bg-amber-500/[0.02]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'h-5 w-0.5 shrink-0 rounded-full',
                              `bg-f1-${getTeamColorClass(season.team)}`
                            )}
                          />
                          <span className="text-[13px] font-medium text-white">
                            {season.season}
                          </span>
                          {isCurrent && (
                            <span className="rounded border border-red-400/20 bg-red-400/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-red-400">
                              Now
                            </span>
                          )}
                          {isRookie && !isCurrent && (
                            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-400">
                              Rookie
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-white/80">{season.team}</td>
                      <td className="px-4 py-3 text-[13px] text-white/80">{season.races}</td>
                      <td className="px-4 py-3 text-[13px]">
                        <span
                          className={cn(
                            season.wins > 0 ? 'font-semibold text-white' : 'text-white/80'
                          )}
                        >
                          {season.wins}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-white/80">{season.podiums}</td>
                      <td className="px-4 py-3 text-[13px] text-white/80">{season.poles}</td>
                      <td className="px-4 py-3 text-[13px]">
                        <span
                          className={cn(
                            season.fastestLaps > 0
                              ? 'font-semibold text-purple-400'
                              : 'text-white/80'
                          )}
                        >
                          {season.fastestLaps}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-white">
                        {season.points}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {season.position ? (
                          <span
                            className={cn(
                              'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold',
                              season.position === 1 && 'bg-amber-400/15 text-amber-400',
                              season.position === 2 && 'bg-white/[0.06] text-zinc-300',
                              season.position === 3 && 'bg-orange-400/10 text-orange-400',
                              season.position > 3 && 'text-white/30'
                            )}
                          >
                            {season.position}
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverProfile;
