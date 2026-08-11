// knip-ignore
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { fetchTeamCareer, fetchTeamBio, TeamCareer } from '@/lib/api';
import type { DriverBio } from '@/lib/api';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { SEO } from '@/components/layout/SEO';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { TeamHero } from '@/pages/Team/TeamHero';
import { TeamTabStrip } from '@/pages/Team/TeamTabStrip';
import { TeamChampionshipSection } from '@/pages/Team/TeamChampionshipSection';
import { PageLoader } from '@/components/ui/PageLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTeamProfile from '@/components/mobile/pages/MobileTeamProfile';

const TeamProfile = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileTeamProfile />;
  return <TeamProfileDesktop />;
};

const TeamProfileDesktop = () => {
  const { slug } = useParams<{ slug: string }>();
  const { selectedYear } = useSeason();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

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

  const { data: bio, isLoading: isBioLoading } = useQuery<DriverBio>({
    queryKey: ['teamBio', slug],
    queryFn: () => fetchTeamBio(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Loading state
  if (isLoading) {
    return <PageLoader fullPage message="Loading team profile…" />;
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
          <h3 className="text-[16px] font-semibold text-white">Team Not Found</h3>
          <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-white/40">
            {(error as Error)?.message ||
              `No data available for "${slug}". Check the URL or try another team.`}
          </p>
        </m.div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <SEO
        title={`${career.name} — Team Profile`}
        description={`Career stats, season history, and analytics for ${career.name}. ${career.careerSummary.wins} wins, ${career.careerSummary.podiums} podiums across ${career.careerSummary.seasons} seasons.`}
      />

      <div className="space-y-5">
        {/* Hero */}
        <TeamHero
          career={career}
          bio={bio}
          isBioLoading={isBioLoading}
          fallbackImageUrl={slug ? `/api/team/${encodeURIComponent(slug)}/image` : undefined}
        />

        {/* Tab Strip */}
        <TeamTabStrip activeTab={activeTab} onTabChange={handleTabChange} />

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
              <TeamOverviewSection career={career} selectedYear={selectedYear} />
            )}
            {activeTab === 'championship' && (
              <TeamChampionshipSection career={career} slug={slug!} />
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamProfile;

/* ─── Overview: Season History Table ─── */
function TeamOverviewSection({
  career,
  selectedYear,
}: {
  career: TeamCareer;
  selectedYear: number;
}) {
  return (
    <div className={CARD_CONTAINER}>
      <div className="px-5 pt-5 pb-3">
        <span className={CARD_LABEL}>Season History</span>
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Season</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Races</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Wins</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Podiums</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Poles</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Points</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">Drivers</th>
                <th className="px-4 py-3 text-[12px] font-medium text-white/80">WCC</th>
              </tr>
            </thead>
            <tbody>
              {career.seasons.map((season) => {
                const isCurrent = season.season === selectedYear;
                const isChampion = season.position === 1;

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
                            `bg-f1-${getTeamColorClass(career.name)}`
                          )}
                        />
                        <span className="text-[13px] font-medium text-white">{season.season}</span>
                        {isCurrent && (
                          <span className="rounded border border-red-400/20 bg-red-400/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-red-400">
                            Now
                          </span>
                        )}
                      </div>
                    </td>
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
                    <td className="px-4 py-3 text-[13px] font-medium text-white">
                      {season.points}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      <div className="flex flex-wrap gap-1">
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
  );
}
