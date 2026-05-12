// knip-ignore
import React, { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
import { fetchDriverCareer, DriverCareer } from '@/lib/api';
import { getDriverImage, getDriverImagesByCode } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { SEO } from '@/components/layout/SEO';
import { DriverHeader } from '@/pages/Driver/DriverHeader';
import { DriverStatCard } from '@/pages/Driver/DriverStatCard';
import {
  ChartLineData01Icon,
  UserGroupIcon,
  Target01Icon,
  Award01Icon,
  Analytics01Icon,
  Activity01Icon,
  TradeUpIcon,
  FlashIcon,
  GitCompareIcon,
  ChampionIcon,
  DashboardSpeed01Icon,
} from 'hugeicons-react';

const TrajectoryChart = lazy(
  () => import('@/components/career-analytics/placeholders/TrajectoryChart')
);
const TeammateComparison = lazy(
  () => import('@/components/career-analytics/placeholders/TeammateComparison')
);
const WhatIfPoints = lazy(() => import('@/components/career-analytics/placeholders/WhatIfPoints'));
const MilestonesTimeline = lazy(
  () => import('@/components/career-analytics/placeholders/MilestonesTimeline')
);
const ConsistencyScore = lazy(
  () => import('@/components/career-analytics/placeholders/ConsistencyScore')
);
const MovementMap = lazy(() => import('@/components/career-analytics/placeholders/MovementMap'));
const EraRankings = lazy(() => import('@/components/career-analytics/placeholders/EraRankings'));
const FormStreaks = lazy(() => import('@/components/career-analytics/placeholders/FormStreaks'));
const CareerComparison = lazy(
  () => import('@/components/career-analytics/placeholders/CareerComparison')
);
const PeakSeason = lazy(() => import('@/components/career-analytics/placeholders/PeakSeason'));
const DrivingFingerprint = lazy(
  () => import('@/components/career-analytics/placeholders/DrivingFingerprint')
);

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const DRIVER_SKELETONS = Array.from({ length: 8 }, (_, i) => `ds-${i}`);

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: ChartLineData01Icon },
  { id: 'trajectory', label: 'Trajectory', icon: Analytics01Icon },
  { id: 'teammate', label: 'Teammate H2H', icon: UserGroupIcon },
  { id: 'whatif', label: 'What-If Points', icon: Target01Icon },
  { id: 'milestones', label: 'Milestones', icon: Award01Icon },
  { id: 'consistency', label: 'Consistency', icon: TradeUpIcon },
  { id: 'movement', label: 'Movement Map', icon: Activity01Icon },
  { id: 'era-rankings', label: 'Era Rankings', icon: ChampionIcon },
  { id: 'streaks', label: 'Form Streaks', icon: FlashIcon },
  { id: 'comparison', label: 'Comparison', icon: GitCompareIcon },
  { id: 'peak-season', label: 'Peak Season', icon: DashboardSpeed01Icon },
  { id: 'fingerprint', label: 'Fingerprint', icon: Analytics01Icon },
] as const;

function SectionSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-xl bg-white/[0.04]" />;
}

const DriverProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedYear } = useSeason();
  const [selectedImageYear, setSelectedImageYear] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

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

  const driverCode = career?.code || '';
  const teamColor = career?.seasons[0]?.team ? getTeamColorClass(career.seasons[0].team) : 'gray';
  const countryCode = getNationalityCountryCode(career?.nationality);

  const availableImages = useMemo(() => {
    if (!driverCode) return [];
    return getDriverImagesByCode(driverCode);
  }, [driverCode]);

  const currentImageUrl = useMemo(() => {
    if (selectedImageYear) return getDriverImage(driverCode, selectedImageYear);
    const latest = availableImages[0];
    return latest?.url || getDriverImage(driverCode, selectedYear);
  }, [driverCode, selectedImageYear, availableImages, selectedYear]);

  const summary = career?.careerSummary;
  const rookieSeason = career?.seasons.length
    ? career.seasons[career.seasons.length - 1]?.season
    : null;

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
        <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]" />
              <div className="space-y-4 lg:col-span-2">
                <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="grid grid-cols-4 gap-3">
                  {DRIVER_SKELETONS.map((id) => (
                    <div key={id} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !career) {
    return (
      <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
        <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-5 pb-20 pt-24 lg:px-8">
          <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] px-10 py-16 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
              <span className="text-lg text-red-400">!</span>
            </div>
            <h3 className="text-[18px] font-semibold uppercase italic text-white">
              Driver Not Found
            </h3>
            <p className="mt-1 text-[14px] text-white/40">
              {(error as Error)?.message || `We couldn't find data for "${slug}".`}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title={`${career.name}: profile`}
        description={`Explore career stats, results, wins, podiums, and season history for ${career.name} on Fastlytics.`}
      />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        <DriverHeader
          career={career}
          teamColor={teamColor}
          countryCode={countryCode}
          currentImageUrl={currentImageUrl}
          availableImages={availableImages}
          selectedImageYear={selectedImageYear}
          setSelectedImageYear={setSelectedImageYear}
        />

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Navigation */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 space-y-1.5">
              {NAV_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all',
                      isActive
                        ? 'bg-red-500/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(239,68,68,0.2)]'
                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    <Icon className={cn('size-4', isActive ? 'text-red-400' : 'text-white/30')} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-2 lg:hidden">
            {NAV_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors',
                    isActive
                      ? 'border border-red-500/20 bg-red-500/[0.08] text-white'
                      : 'text-white/50 hover:text-white/80'
                  )}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {activeSection === 'overview' && (
              <OverviewSection
                career={career}
                teamColor={teamColor}
                summary={summary}
                rookieSeason={rookieSeason}
                selectedYear={selectedYear}
              />
            )}

            {activeSection === 'trajectory' && (
              <AnalyticsSection title="Career Trajectory">
                <TrajectoryChart career={career} entityType="driver" />
              </AnalyticsSection>
            )}

            {activeSection === 'teammate' && (
              <AnalyticsSection title="Teammate Head-to-Head">
                <TeammateComparison slug={slug!} />
              </AnalyticsSection>
            )}

            {activeSection === 'whatif' && (
              <AnalyticsSection title="What-If Points">
                <WhatIfPoints slug={slug!} />
              </AnalyticsSection>
            )}

            {activeSection === 'milestones' && (
              <AnalyticsSection title="Career Milestones">
                <MilestonesTimeline slug={slug!} entityType="driver" />
              </AnalyticsSection>
            )}

            {activeSection === 'consistency' && (
              <AnalyticsSection title="Consistency Score">
                <ConsistencyScore career={career} entityType="driver" />
              </AnalyticsSection>
            )}

            {activeSection === 'movement' && (
              <AnalyticsSection title="Team Movement Map">
                <MovementMap career={career} entityType="driver" />
              </AnalyticsSection>
            )}

            {activeSection === 'era-rankings' && (
              <AnalyticsSection title="Era-Adjusted Rankings">
                <EraRankings career={career} entityType="driver" />
              </AnalyticsSection>
            )}

            {activeSection === 'streaks' && (
              <AnalyticsSection title="Form Streaks">
                <FormStreaks slug={slug!} />
              </AnalyticsSection>
            )}

            {activeSection === 'comparison' && (
              <AnalyticsSection title="Career Comparison">
                <CareerComparison entityType="driver" initialSlug={slug} />
              </AnalyticsSection>
            )}

            {activeSection === 'peak-season' && (
              <AnalyticsSection title="Peak Season">
                <PeakSeason slug={slug!} entityType="driver" />
              </AnalyticsSection>
            )}

            {activeSection === 'fingerprint' && (
              <AnalyticsSection title="Driving Fingerprint">
                <DrivingFingerprint slug={slug!} />
              </AnalyticsSection>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

function AnalyticsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">{title}</h2>
        <div className="h-px flex-1 bg-white/[0.05]" />
      </div>
      <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
    </m.div>
  );
}

function OverviewSection({
  career,
  teamColor,
  summary,
  rookieSeason,
  selectedYear,
}: {
  career: DriverCareer;
  teamColor: string;
  summary: DriverCareer['careerSummary'] | undefined;
  rookieSeason: number | null;
  selectedYear: number;
}) {
  const stats = [
    { label: 'Seasons', value: summary?.seasons ?? 0 },
    { label: 'Races', value: summary?.races ?? 0 },
    { label: 'Wins', value: summary?.wins ?? 0 },
    { label: 'Podiums', value: summary?.podiums ?? 0 },
    { label: 'Poles', value: summary?.poles ?? 0 },
    { label: 'Fastest Laps', value: summary?.fastestLaps ?? 0 },
    { label: 'Points', value: summary?.points ?? 0 },
    { label: 'DNFs', value: summary?.dnfs ?? 0 },
  ];

  return (
    <div className="space-y-10">
      {/* Career Stats */}
      <section>
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
            Career Stats
          </h2>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <DriverStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              teamColor={teamColor}
              delay={i * 0.05}
            />
          ))}
        </div>
      </section>

      {/* Season History */}
      <section>
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
            Season by Season
          </h2>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0c0c0e] text-[11px] font-bold uppercase tracking-wider text-white/30">
                  <th className="px-4 py-3 text-left">Season</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-center">Races</th>
                  <th className="px-4 py-3 text-center">Wins</th>
                  <th className="px-4 py-3 text-center">Podiums</th>
                  <th className="px-4 py-3 text-center">Poles</th>
                  <th className="px-4 py-3 text-center">FL</th>
                  <th className="px-4 py-3 text-center">Points</th>
                  <th className="px-4 py-3 text-center">WDC</th>
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
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.025 }}
                      className={cn(
                        'border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]',
                        isCurrent && 'border-l-2 border-l-red-500 bg-red-500/[0.02]',
                        isChampion &&
                          !isCurrent &&
                          'border-l-2 border-l-amber-500 bg-amber-500/[0.02]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold tabular-nums text-white">
                            {season.season}
                          </span>
                          {isCurrent && (
                            <span className="rounded-full border border-red-500/20 bg-red-500/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                              Current
                            </span>
                          )}
                          {isRookie && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                              Rookie
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'h-2.5 w-1 rounded-full',
                              `bg-f1-${getTeamColorClass(season.team)}`
                            )}
                          />
                          <span className="text-[14px] text-white/60">{season.team}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[14px] font-medium tabular-nums text-white">
                          {season.races}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-[14px] font-medium tabular-nums',
                            season.wins > 0 ? 'text-white' : 'text-white/30'
                          )}
                        >
                          {season.wins}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-[14px] font-medium tabular-nums',
                            season.podiums > 0 ? 'text-white' : 'text-white/30'
                          )}
                        >
                          {season.podiums}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-[14px] font-medium tabular-nums',
                            season.poles > 0 ? 'text-white' : 'text-white/30'
                          )}
                        >
                          {season.poles}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'text-[14px] font-medium tabular-nums',
                            season.fastestLaps > 0 ? 'text-purple-400' : 'text-white/30'
                          )}
                        >
                          {season.fastestLaps}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[14px] font-bold tabular-nums text-white">
                          {season.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {season.position ? (
                          <span
                            className={cn(
                              'inline-flex size-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                              season.position === 1 && 'bg-amber-500/20 text-amber-400',
                              season.position === 2 && 'bg-zinc-500/20 text-zinc-300',
                              season.position === 3 && 'bg-orange-500/20 text-orange-400',
                              season.position > 3 && 'bg-white/[0.04] text-white/40'
                            )}
                          >
                            {season.position}
                          </span>
                        ) : (
                          <span className="text-[12px] text-white/20">—</span>
                        )}
                      </td>
                    </m.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DriverProfile;
