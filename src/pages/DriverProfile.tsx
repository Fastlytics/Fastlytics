import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { fetchDriverCareer, DriverCareer } from '@/lib/api';
import { getDriverImage, getDriverImagesByCode } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { SEO } from '@/components/layout/SEO';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const StatBox = ({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: string | number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4 text-center"
  >
    <div className="text-2xl font-bold tabular-nums text-white">{value}</div>
    <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
      {label}
    </div>
  </motion.div>
);

const SeasonRow = ({
  season,
  index,
  isCurrent,
  isRookie,
  isChampion,
}: {
  season: DriverCareer['seasons'][number];
  index: number;
  isCurrent: boolean;
  isRookie: boolean;
  isChampion: boolean;
}) => (
  <motion.tr
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.025 }}
    className={cn(
      'border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]',
      isCurrent && 'border-l-2 border-l-red-500 bg-red-500/[0.02]',
      isChampion && !isCurrent && 'border-l-2 border-l-amber-500 bg-amber-500/[0.02]'
    )}
  >
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-bold tabular-nums text-white">{season.season}</span>
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
        {isChampion && (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Champion
          </span>
        )}
      </div>
    </td>
    <td className="py-3 px-4 text-[14px] text-white/60">{season.team}</td>
    <td className="py-3 px-4 text-center text-[14px] font-medium tabular-nums text-white">
      {season.races}
    </td>
    <td className="py-3 px-4 text-center text-[14px] font-medium tabular-nums text-white">
      {season.wins}
    </td>
    <td className="py-3 px-4 text-center text-[14px] font-medium tabular-nums text-white">
      {season.podiums}
    </td>
    <td className="py-3 px-4 text-center text-[14px] font-medium tabular-nums text-white">
      {season.poles}
    </td>
    <td className="py-3 px-4 text-center text-[14px] font-medium tabular-nums text-white">
      {season.fastestLaps}
    </td>
    <td className="py-3 px-4 text-center text-[14px] font-bold tabular-nums text-white">
      {season.points}
    </td>
    <td className="py-3 px-4 text-center">
      {season.position ? (
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
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
  </motion.tr>
);

const DriverProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedYear } = useSeason();
  const [selectedImageYear, setSelectedImageYear] = useState<number | null>(null);

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
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
              <span className="text-lg text-red-400">!</span>
            </div>
            <h3 className="text-[18px] font-bold uppercase italic text-white">Driver Not Found</h3>
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
        title={`${career.name} — Driver Profile | Fastlytics`}
        description={`Career stats and season history for ${career.name}.`}
      />
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                Driver Profile
              </span>
            </div>
            <h1 className="text-3xl font-bold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              {career.name}
            </h1>
            <p className="mt-1 text-[15px] text-white/50">Career Statistics & Season History</p>
          </motion.div>
          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        {/* Hero */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-end">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className={cn('absolute inset-0 opacity-10', `bg-f1-${teamColor}`)} />
              <div className="relative flex justify-center pt-6">
                <div className="relative h-72 w-56 lg:h-80 lg:w-60">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt={career.name}
                      className="h-full w-full object-cover object-top"
                      style={{
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-4xl font-black italic text-white/10">
                        {career.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Season selector */}
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
          </motion.div>

          {/* Info & Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {countryCode !== 'xx' && (
                <img
                  src={`https://flagcdn.com/h40/${countryCode}.png`}
                  alt={career.nationality}
                  className="h-5 w-auto rounded-sm opacity-90"
                />
              )}
              <span className="text-[15px] font-medium text-white/60">{career.nationality}</span>
              <span className="text-white/20">·</span>
              {career.seasons[0]?.team && (
                <span className="text-[15px] font-medium text-white/60">
                  {career.seasons[0].team}
                </span>
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Seasons" value={summary?.seasons ?? 0} delay={0} />
              <StatBox label="Races" value={summary?.races ?? 0} delay={0.05} />
              <StatBox label="Wins" value={summary?.wins ?? 0} delay={0.1} />
              <StatBox label="Podiums" value={summary?.podiums ?? 0} delay={0.15} />
              <StatBox label="Poles" value={summary?.poles ?? 0} delay={0.2} />
              <StatBox label="Fastest Laps" value={summary?.fastestLaps ?? 0} delay={0.25} />
              <StatBox label="Points" value={summary?.points ?? 0} delay={0.3} />
              <StatBox label="DNFs" value={summary?.dnfs ?? 0} delay={0.35} />
            </div>
          </motion.div>
        </div>

        {/* Season Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="mb-4 text-xl font-bold uppercase italic tracking-[-0.025em] text-white">
            Season by Season
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
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
                {career.seasons.map((season, i) => (
                  <SeasonRow
                    key={season.season}
                    season={season}
                    index={i}
                    isCurrent={season.season === selectedYear}
                    isRookie={season.season === rookieSeason}
                    isChampion={season.position === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export { DriverProfile };
export default DriverProfile;
