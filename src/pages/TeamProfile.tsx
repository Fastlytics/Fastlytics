import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { fetchTeamCareer, TeamCareer } from '@/lib/api';
import { getCarImage } from '@/utils/imageMapping';
import { getTeamColorClass } from '@/lib/standingsUtils';
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
  isChampion,
}: {
  season: TeamCareer['seasons'][number];
  index: number;
  isCurrent: boolean;
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
        {isChampion && (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Champion
          </span>
        )}
      </div>
    </td>
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
    <td className="py-3 px-4 text-center text-[14px] font-bold tabular-nums text-white">
      {season.points}
    </td>
    <td className="py-3 px-4">
      <div className="flex flex-wrap gap-1 justify-center">
        {season.drivers.map((code) => (
          <span
            key={code}
            className="inline-block rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-bold tabular-nums uppercase tracking-wider text-white/50"
          >
            {code}
          </span>
        ))}
      </div>
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

const TeamProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedYear } = useSeason();

  const {
    data: career,
    isLoading,
    isError,
    error,
  } = useQuery<TeamCareer>({
    queryKey: ['teamCareer', slug],
    queryFn: () => fetchTeamCareer(slug!),
    enabled: !!slug,
  });

  const teamColor = career?.name ? getTeamColorClass(career.name) : 'gray';
  const carImage = career?.name ? getCarImage(career.name, selectedYear) : '';
  const summary = career?.careerSummary;

  if (isLoading) {
    return (
      <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
        <DashboardNavbar />
        <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.04]" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-64 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]" />
              <div className="lg:col-span-2 space-y-4">
                <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(7)].map((_, i) => (
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
            <h3 className="text-[18px] font-bold uppercase italic text-white">Team Not Found</h3>
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
        title={`${career.name} — Team Profile | Fastlytics`}
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
                Team Profile
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
          {/* Car Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
              <div className={cn('absolute inset-0 opacity-10', `bg-f1-${teamColor}`)} />
              <div className="relative flex items-center justify-center p-6">
                <div className="relative h-44 w-full">
                  {carImage ? (
                    <img
                      src={carImage}
                      alt={career.name}
                      className="h-full w-full object-contain object-center drop-shadow-2xl"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-5xl font-black italic text-white/10">
                        {career.name[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
              <span className="text-[15px] font-medium text-white/60">{career.nationality}</span>
              {summary?.constructorsChampionships ? (
                <>
                  <span className="text-white/20">·</span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {summary.constructorsChampionships}x Constructors' Champion
                  </span>
                </>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              <StatBox label="Seasons" value={summary?.seasons ?? 0} delay={0} />
              <StatBox label="Races" value={summary?.races ?? 0} delay={0.05} />
              <StatBox label="Wins" value={summary?.wins ?? 0} delay={0.1} />
              <StatBox label="Podiums" value={summary?.podiums ?? 0} delay={0.15} />
              <StatBox label="Poles" value={summary?.poles ?? 0} delay={0.2} />
              <StatBox label="Points" value={summary?.points ?? 0} delay={0.25} />
              <StatBox
                label="WCC Titles"
                value={summary?.constructorsChampionships ?? 0}
                delay={0.3}
              />
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
                  <th className="py-3 px-4 text-center">Races</th>
                  <th className="py-3 px-4 text-center">Wins</th>
                  <th className="py-3 px-4 text-center">Podiums</th>
                  <th className="py-3 px-4 text-center">Poles</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4 text-center">Drivers</th>
                  <th className="py-3 px-4 text-center">WCC</th>
                </tr>
              </thead>
              <tbody>
                {career.seasons.map((season, i) => (
                  <SeasonRow
                    key={season.season}
                    season={season}
                    index={i}
                    isCurrent={season.season === selectedYear}
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

export { TeamProfile };
export default TeamProfile;
