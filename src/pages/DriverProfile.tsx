// knip-ignore
import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { fetchDriverCareer, fetchDriverBio, DriverCareer } from '@/lib/api';
import { getDriverImage, getDriverImagesByCode } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { DriverHero } from '@/pages/Driver/DriverHero';
import { DriverTabStrip } from '@/pages/Driver/DriverTabStrip';

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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-5 text-white">
        <div className={cn(CARD_CONTAINER, 'h-[400px] animate-pulse')} />
        <div className="h-11 animate-pulse rounded-lg bg-white/[0.02]" />
        <div className={cn(CARD_CONTAINER, 'h-[300px] animate-pulse')} />
      </div>
    );
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
      <div className={cn(CARD_CONTAINER, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Season
                </th>
                <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Team
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Races
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Wins
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Podiums
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Poles
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  FL
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  Points
                </th>
                <th className="px-3 py-3.5 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
                  WDC
                </th>
              </tr>
            </thead>
            <tbody>
              {career.seasons.map((season, i) => {
                const isCurrent = season.season === selectedYear;
                const isChampion = season.position === 1;
                const isRookie = season.season === rookieSeason;

                return (
                  <m.tr
                    key={season.season}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    className={cn(
                      'group border-b border-white/[0.03] transition-colors hover:bg-white/[0.015]',
                      isCurrent && 'bg-red-500/[0.02]',
                      isChampion && !isCurrent && 'bg-amber-500/[0.015]'
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-block size-1.5 rounded-full',
                            `bg-f1-${getTeamColorClass(season.team)}`
                          )}
                        />
                        <span className="font-semibold tabular-nums text-white">
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
                    <td className="px-4 py-3">
                      <span className="text-white/60">{season.team}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="tabular-nums text-white/80">{season.races}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'tabular-nums',
                          season.wins > 0 ? 'font-semibold text-white' : 'text-white/20'
                        )}
                      >
                        {season.wins}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'tabular-nums',
                          season.podiums > 0 ? 'text-white/80' : 'text-white/20'
                        )}
                      >
                        {season.podiums}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'tabular-nums',
                          season.poles > 0 ? 'text-white/80' : 'text-white/20'
                        )}
                      >
                        {season.poles}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'tabular-nums',
                          season.fastestLaps > 0 ? 'text-purple-400' : 'text-white/20'
                        )}
                      >
                        {season.fastestLaps}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold tabular-nums text-white">{season.points}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {season.position ? (
                        <span
                          className={cn(
                            'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                            season.position === 1 && 'bg-amber-400/15 text-amber-400',
                            season.position === 2 && 'bg-white/[0.06] text-zinc-300',
                            season.position === 3 && 'bg-orange-400/10 text-orange-400',
                            season.position > 3 && 'text-white/30'
                          )}
                        >
                          {season.position}
                        </span>
                      ) : (
                        <span className="text-white/15">—</span>
                      )}
                    </td>
                  </m.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DriverProfile;
