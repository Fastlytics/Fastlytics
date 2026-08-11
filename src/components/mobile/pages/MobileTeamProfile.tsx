import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, m } from 'motion/react';
import { ArrowLeft01Icon } from 'hugeicons-react';
import { fetchTeamCareer, fetchTeamBio, TeamCareer } from '@/lib/api';
import type { DriverBio } from '@/lib/api';
import { getTeamColorClass } from '@/lib/standingsUtils';
import { getNationalityCountryCode } from '@/utils/countryUtils';
import { getTeamLogo } from '@/lib/teamUtils';
import { cn } from '@/lib/utils';
import { useSeason } from '@/contexts/SeasonContext';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';
import { FastlyticsLogo } from '@/components/brand/FastlyticsLogo';
import { TeamChampionshipSection } from '@/pages/Team/TeamChampionshipSection';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'championship', label: 'Championship' },
] as const;

export default function MobileTeamProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useSeason();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const {
    data: career,
    isLoading,
    isError,
  } = useQuery<TeamCareer>({
    queryKey: ['teamCareer', slug],
    queryFn: () => fetchTeamCareer(slug!),
    enabled: !!slug,
  });

  const { data: bio } = useQuery<DriverBio>({
    queryKey: ['teamBio', slug],
    queryFn: () => fetchTeamBio(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const teamLogo = career ? getTeamLogo(career.name) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0a0a0a]/95 px-4 pt-3 pb-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex size-8 items-center justify-center rounded-lg text-white/40 transition-colors active:bg-white/[0.04] active:text-white/70"
            aria-label="Go back"
          >
            <ArrowLeft01Icon className="size-4" />
          </button>
          <FastlyticsLogo size={22} />
          <div className="size-8" />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4 pb-24">
        {isLoading || !career ? (
          <div className="space-y-3">
            <div className={`${CARD_CONTAINER} h-44 animate-pulse`} />
            <div className={`${CARD_CONTAINER} h-32 animate-pulse`} />
          </div>
        ) : isError ? (
          <div className={`${CARD_CONTAINER} px-5 py-12 text-center`}>
            <p className="text-[14px] text-white/60">Team not found</p>
            <p className="mt-1 text-[12px] text-white/40">Check the URL or try another team.</p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className={cn(CARD_CONTAINER, 'relative overflow-hidden')}>
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14]"
                style={{
                  background: `linear-gradient(to top, var(--color-f1-${getTeamColorClass(career.name)}), transparent 70%)`,
                }}
                aria-hidden
              />
              <div className="relative flex gap-4 p-4">
                <div className="flex w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                  {teamLogo ? (
                    <img
                      src={teamLogo}
                      alt={career.name}
                      className="max-h-full w-full object-contain"
                    />
                  ) : (
                    <span className="font-mono text-[14px] font-medium text-white/40">
                      {career.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://flagcdn.com/${getNationalityCountryCode(career.nationality)}.svg`}
                        alt={career.nationality}
                        className="h-3 w-auto rounded-sm opacity-70"
                      />
                      <span className="text-[11px] text-white/40">{career.nationality}</span>
                    </div>
                    <h1 className="mt-1 truncate text-[20px] font-semibold tracking-[-0.01em] text-white">
                      {career.name}
                    </h1>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-t border-white/[0.04] pt-3">
                    {[
                      { label: 'Wins', value: career.careerSummary.wins },
                      { label: 'Podiums', value: career.careerSummary.podiums },
                      { label: 'Poles', value: career.careerSummary.poles },
                      { label: 'WCC', value: career.careerSummary.constructorsChampionships },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="font-mono text-[15px] font-semibold tabular-nums text-white">
                          {stat.value}
                        </div>
                        <div className="text-[10px] text-white/40">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Career summary */}
            <div className={`${CARD_CONTAINER} p-4`}>
              <span className={CARD_LABEL}>Career Summary</span>
              <div className="mt-3 grid grid-cols-3 gap-y-3">
                {[
                  { label: 'Seasons', value: career.careerSummary.seasons },
                  { label: 'Races', value: career.careerSummary.races },
                  { label: 'Points', value: career.careerSummary.points },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-mono text-[14px] font-medium tabular-nums text-white">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-white/40">{stat.label}</div>
                  </div>
                ))}
              </div>
              {bio?.extract && (
                <p className="mt-3 line-clamp-3 border-t border-white/[0.04] pt-3 text-[12px] leading-relaxed text-white/50">
                  {bio.extract}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg border border-white/[0.04] bg-white/[0.02] p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 rounded-md py-2 text-[12px] font-medium transition-colors active:scale-[0.98]',
                    activeTab === tab.id ? 'bg-white/[0.08] text-white' : 'text-white/40'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <m.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {activeTab === 'overview' && (
                  <div className={`${CARD_CONTAINER} overflow-hidden`}>
                    <div className="border-b border-white/[0.04] px-4 py-3">
                      <span className={CARD_LABEL}>Season History</span>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {career.seasons.map((season) => {
                        const isCurrent = season.season === selectedYear;
                        const isChampion = season.position === 1;
                        return (
                          <div key={season.season} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'h-5 w-0.5 shrink-0 rounded-full',
                                    `bg-f1-${getTeamColorClass(career.name)}`
                                  )}
                                />
                                <span className="text-[14px] font-medium text-white">
                                  {season.season}
                                </span>
                                {isCurrent && (
                                  <span className="rounded border border-red-400/20 bg-red-400/[0.06] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-red-400">
                                    Now
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'inline-flex size-6 items-center justify-center rounded-full text-[11px] font-semibold',
                                  isChampion && 'bg-amber-400/15 text-amber-400',
                                  season.position === 2 && 'bg-white/[0.06] text-zinc-300',
                                  season.position === 3 && 'bg-orange-400/10 text-orange-400',
                                  (season.position ?? 0) > 3 && 'text-white/30'
                                )}
                              >
                                {season.position ?? '—'}
                              </span>
                            </div>
                            <div className="mt-2.5 grid grid-cols-4 gap-2">
                              {[
                                { label: 'Races', value: season.races },
                                { label: 'Wins', value: season.wins },
                                { label: 'Podiums', value: season.podiums },
                                { label: 'Pts', value: season.points },
                              ].map((stat) => (
                                <div
                                  key={stat.label}
                                  className="rounded-md border border-white/[0.03] bg-white/[0.02] px-2 py-1.5 text-center"
                                >
                                  <div className="font-mono text-[13px] font-medium tabular-nums text-white">
                                    {stat.value}
                                  </div>
                                  <div className="text-[9px] uppercase tracking-wider text-white/30">
                                    {stat.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {season.drivers.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {season.drivers.map((code) => (
                                  <span
                                    key={code}
                                    className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'championship' && (
                  <TeamChampionshipSection career={career} slug={slug!} />
                )}
              </m.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
