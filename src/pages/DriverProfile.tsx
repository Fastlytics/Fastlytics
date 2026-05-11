// knip-ignore
import React, { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { fetchDriverCareer, DriverCareer } from '@/lib/api';
import { getDriverImage, getDriverImagesByCode } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { SEO } from '@/components/layout/SEO';
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

// Lazy-loaded analytics sections
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

/** Navigation sections matching the Race page's TelemetryTabs pattern */
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
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-96 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]" />
              <div className="lg:col-span-2 space-y-4">
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
        <DashboardNavbar />
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
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        {/* Header — matches Race page pattern */}
        <div className="mb-10">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                Driver Profile
              </span>
            </div>
            <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              {career.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {countryCode !== 'xx' && (
                <img
                  src={`https://flagcdn.com/h40/${countryCode}.png`}
                  alt={career.nationality}
                  className="h-4 w-auto rounded-sm opacity-80"
                />
              )}
              <span className="text-[15px] text-white/50">{career.nationality}</span>
              {career.seasons[0]?.team && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-[15px] text-white/50">{career.seasons[0].team}</span>
                </>
              )}
              {career.seasons[0]?.position === 1 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    World Champion
                  </span>
                </>
              )}
            </div>
          </m.div>
          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        {/* Sidebar + Content — matches Race page layout */}
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
          <div className="flex gap-1 overflow-x-auto pb-2 lg:hidden scrollbar-hide">
            {NAV_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors',
                    isActive
                      ? 'bg-red-500/[0.08] text-white border border-red-500/20'
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
                currentImageUrl={currentImageUrl}
                availableImages={availableImages}
                selectedImageYear={selectedImageYear}
                setSelectedImageYear={setSelectedImageYear}
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

/** Analytics section wrapper — consistent section header + suspense boundary */
function AnalyticsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">{title}</h2>
      </div>
      <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
    </m.div>
  );
}

/** Overview section — driver image, stats, and season history */
function OverviewSection({
  career,
  teamColor,
  currentImageUrl,
  availableImages,
  selectedImageYear,
  setSelectedImageYear,
  summary,
  rookieSeason,
  selectedYear,
}: {
  career: DriverCareer;
  teamColor: string;
  currentImageUrl: string | undefined;
  availableImages: { year: number; url: string }[];
  selectedImageYear: number | null;
  setSelectedImageYear: (year: number | null) => void;
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
      {/* Driver Image + Stats */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
            Career Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
          {/* Driver Image Card */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className={cn('absolute inset-0 opacity-10', `bg-f1-${teamColor}`)} />
              <div className="relative flex justify-center pt-6">
                <div className="relative h-64 w-48 lg:h-72 lg:w-56">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt={career.name}
                      className="size-full object-cover object-top"
                      style={{
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                      }}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <span className="text-4xl font-black italic text-white/10">
                        {career.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {availableImages.length > 1 && (
                <div className="relative z-10 flex items-center justify-center gap-1.5 pb-4">
                  {availableImages.map((img) => (
                    <button
                      key={img.year}
                      onClick={() =>
                        setSelectedImageYear(selectedImageYear === img.year ? null : img.year)
                      }
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums uppercase tracking-wider transition-all',
                        selectedImageYear === img.year ||
                          (selectedImageYear === null && img.year === availableImages[0].year)
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/30 hover:text-white/60'
                      )}
                    >
                      {img.year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </m.div>

          {/* Stats Grid */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <m.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4 text-center"
                >
                  <div className="text-2xl font-bold tabular-nums text-white">{stat.value}</div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                    {stat.label}
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      {/* Season History */}
      <section>
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/40">
            Season by Season
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0c0c0e] text-[11px] font-bold uppercase tracking-wider text-white/30">
                  <th className="py-3 px-4 text-left">Season</th>
                  <th className="py-3 px-4 text-left">Team</th>
                  <th className="py-3 px-4 text-center">Races</th>
                  <th className="py-3 px-4 text-center">Wins</th>
                  <th className="py-3 px-4 text-center">Podiums</th>
                  <th className="py-3 px-4 text-center">Poles</th>
                  <th className="py-3 px-4 text-center">FL</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4 text-center">WDC</th>
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
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <span className="text-[14px] text-white/60">{season.team}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-medium tabular-nums text-white">
                          {season.races}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-medium tabular-nums text-white">
                          {season.wins}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-medium tabular-nums text-white">
                          {season.podiums}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-medium tabular-nums text-white">
                          {season.poles}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-medium tabular-nums text-white">
                          {season.fastestLaps}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[14px] font-bold tabular-nums text-white">
                          {season.points}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {season.position ? (
                          <span
                            className={cn(
                              'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                              season.position === 1 && 'bg-amber-500/20 text-amber-400',
                              season.position === 2 && 'bg-zinc-500/20 text-zinc-300',
                              season.position === 3 && 'bg-orange-500/20 text-orange-400',
                              season.position > 3 && 'bg-white/[0.04] text-white/40'
                            )}
                          >
                            {season.position}
                          </span>
                        ) : (
                          <span className="text-[12px] text-white/20">-</span>
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
