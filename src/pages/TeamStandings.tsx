import React, { useMemo, useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion } from 'motion/react';
import { CrownIcon } from 'hugeicons-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import {
  fetchTeamStandings,
  TeamStanding,
  fetchSchedule,
  fetchRaceResults,
  ScheduleEvent,
  RaceResult,
} from '@/lib/api';
import { calculateRemainingPoints, getChampionshipStatus } from '@/lib/championship';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSeason } from '@/contexts/SeasonContext';
import { getCarImage } from '@/utils/imageMapping';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTeamStandings } from '@/components/mobile';
import { isTestingEvent, getTeamColorClass, getChangeIndicator } from '@/lib/standingsUtils';
import { SEO } from '@/components/layout/SEO';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const TeamStandings = () => {
  const [now] = useState(() => Date.now());
  const isMobile = useIsMobile();
  const { selectedYear } = useSeason();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('team_standings', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data: teamStandings,
    isLoading,
    error,
    isError,
  } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
  });

  const { data: schedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => fetchSchedule(selectedYear),
  });

  const hasCompletedRaceEventsInSchedule = useMemo(
    () =>
      (schedule ?? []).some(
        (event) => !isTestingEvent(event) && new Date(event.EventDate).getTime() <= now
      ),
    [schedule, now]
  );

  const { data: raceResults } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => fetchRaceResults(selectedYear),
    enabled: hasCompletedRaceEventsInSchedule,
  });

  const isPreSeason = teamStandings && teamStandings.length > 0 && teamStandings[0].points === 0;
  const top3 = isPreSeason ? [] : teamStandings?.slice(0, 3) || [];
  const rest = isPreSeason ? teamStandings || [] : teamStandings?.slice(3) || [];

  let championshipStatus: 'leader' | 'champion' = 'leader';
  if (teamStandings && teamStandings.length >= 2 && schedule && raceResults) {
    const remainingPoints = calculateRemainingPoints(schedule, raceResults, 'team', selectedYear);
    championshipStatus = getChampionshipStatus(
      teamStandings[0].points,
      teamStandings[1].points,
      remainingPoints
    );
  }

  if (isMobile) {
    return (
      <>
        <SEO
          title={`F1 Constructor Standings ${selectedYear} — Fastlytics`}
          description={`Formula 1 ${selectedYear} Constructor Championship standings, points, wins, and podiums.`}
        />
        <MobileTeamStandings />
      </>
    );
  }

  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title={`F1 Constructor Standings ${selectedYear} — Fastlytics`}
        description={`Formula 1 ${selectedYear} Constructor Championship standings, points, wins, and podiums.`}
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
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                </span>
                Season {selectedYear}
              </span>
            </div>
            <h1 className="text-3xl font-bold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              Constructor Standings
            </h1>
            <p className="mt-1 text-[15px] text-white/50">World Constructors Championship</p>
          </motion.div>
          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
                  />
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
                  />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
                <span className="text-lg text-red-400">!</span>
              </div>
              <h3 className="text-[18px] font-bold uppercase italic text-white">
                Data Unavailable
              </h3>
              <p className="mt-1 text-[14px] text-white/40">
                {(error as Error)?.message || 'Please try again later.'}
              </p>
            </div>
          ) : teamStandings && teamStandings.length > 0 ? (
            <>
              {/* Podium Section */}
              <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-end">
                {/* P2 */}
                {top3[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="order-2 md:order-1"
                  >
                    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] transition-colors hover:border-white/[0.1]">
                      <div
                        className={cn(
                          'absolute left-0 top-0 h-0.5 w-full',
                          `bg-f1-${getTeamColorClass(top3[1].team)}`
                        )}
                      />
                      <div className="absolute right-4 top-4 text-5xl font-bold tabular-nums text-white/[0.06]">
                        2
                      </div>
                      <div className="relative z-10 flex flex-col items-center p-6 pt-10">
                        {getCarImage(top3[1].team, selectedYear) && (
                          <img
                            src={getCarImage(top3[1].team, selectedYear)!}
                            alt={top3[1].team}
                            className="mb-4 h-18 w-auto object-contain [mix-blend-mode:lighten]"
                          />
                        )}
                        <div className="text-[18px] font-bold text-white">{top3[1].team}</div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold tabular-nums text-white">
                            {top3[1].points}
                          </span>
                          <span className="text-[12px] text-white/40">PTS</span>
                        </div>
                        <div className="mt-4 grid w-full grid-cols-2 gap-3">
                          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
                            <div className="text-[16px] font-bold tabular-nums text-white">
                              {top3[1].wins}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                              Wins
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
                            <div className="text-[16px] font-bold tabular-nums text-white">
                              {top3[1].podiums}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                              Podiums
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* P1 */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0, duration: 0.5 }}
                    className="order-1 md:order-2 md:-translate-y-4"
                  >
                    <div className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-[#0c0c0e] shadow-[0_0_60px_rgba(245,158,11,0.06)] transition-colors hover:border-amber-500/50">
                      <div
                        className={cn(
                          'absolute left-0 top-0 h-0.5 w-full',
                          `bg-f1-${getTeamColorClass(top3[0].team)}`
                        )}
                      />
                      <div className="absolute -right-3 -top-3 text-amber-500/10">
                        <CrownIcon className="h-28 w-28" />
                      </div>

                      <div className="relative z-10 flex flex-col items-center p-8 pt-12">
                        <div className="mb-4">
                          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1 text-[12px] font-bold text-amber-400">
                            {championshipStatus === 'champion'
                              ? "Constructors' Champion"
                              : "Constructors' Leader"}
                          </span>
                        </div>
                        {getCarImage(top3[0].team, selectedYear) && (
                          <img
                            src={getCarImage(top3[0].team, selectedYear)!}
                            alt={top3[0].team}
                            className="mb-4 h-20 w-auto object-contain drop-shadow-md [mix-blend-mode:lighten]"
                          />
                        )}
                        <div className="text-[22px] font-bold text-white">{top3[0].team}</div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-4xl font-bold tabular-nums text-amber-400">
                            {top3[0].points}
                          </span>
                          <span className="text-[12px] text-white/40">PTS</span>
                        </div>
                        <div className="mt-5 grid w-full grid-cols-2 gap-3">
                          <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.04] p-3 text-center">
                            <div className="text-[20px] font-bold tabular-nums text-white">
                              {top3[0].wins}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-amber-400/60">
                              Wins
                            </div>
                          </div>
                          <div className="rounded-lg border border-amber-500/10 bg-amber-500/[0.04] p-3 text-center">
                            <div className="text-[20px] font-bold tabular-nums text-white">
                              {top3[0].podiums}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-amber-400/60">
                              Podiums
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* P3 */}
                {top3[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="order-3"
                  >
                    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] transition-colors hover:border-white/[0.1]">
                      <div
                        className={cn(
                          'absolute left-0 top-0 h-0.5 w-full',
                          `bg-f1-${getTeamColorClass(top3[2].team)}`
                        )}
                      />
                      <div className="absolute right-4 top-4 text-5xl font-bold tabular-nums text-white/[0.06]">
                        3
                      </div>
                      <div className="relative z-10 flex flex-col items-center p-6 pt-10">
                        {getCarImage(top3[2].team, selectedYear) && (
                          <img
                            src={getCarImage(top3[2].team, selectedYear)!}
                            alt={top3[2].team}
                            className="mb-4 h-18 w-auto object-contain [mix-blend-mode:lighten]"
                          />
                        )}
                        <div className="text-[18px] font-bold text-white">{top3[2].team}</div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold tabular-nums text-white">
                            {top3[2].points}
                          </span>
                          <span className="text-[12px] text-white/40">PTS</span>
                        </div>
                        <div className="mt-4 grid w-full grid-cols-2 gap-3">
                          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
                            <div className="text-[16px] font-bold tabular-nums text-white">
                              {top3[2].wins}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                              Wins
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
                            <div className="text-[16px] font-bold tabular-nums text-white">
                              {top3[2].podiums}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                              Podiums
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Rest of the Grid */}
              <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e]">
                <div className="divide-y divide-white/[0.04]">
                  {rest.map((team, index) => {
                    const indicator = getChangeIndicator(team.points_change);
                    const carImg = getCarImage(team.team, selectedYear);

                    return (
                      <motion.div
                        key={team.team}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.4 }}
                        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                      >
                        <span className="w-6 shrink-0 text-[15px] tabular-nums font-medium text-white/40">
                          {team.rank}
                        </span>

                        <div
                          className={cn(
                            'h-8 w-0.5 shrink-0 rounded-full',
                            `bg-f1-${getTeamColorClass(team.team)}`
                          )}
                        />

                        <div className="flex h-28 w-28 shrink-0 items-center justify-center">
                          {carImg ? (
                            <img
                              src={carImg}
                              alt={team.team}
                              className="h-full w-full object-contain [mix-blend-mode:lighten]"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#1a1a1e]">
                              <span className="text-[11px] font-bold text-white/55">
                                {team.team.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="truncate text-[15px] font-semibold text-white group-hover:text-red-400 transition-colors">
                            {team.team}
                          </span>
                        </div>

                        <div className="hidden items-center gap-6 md:flex">
                          <div className="text-right">
                            <div className="text-[14px] font-semibold tabular-nums text-white">
                              {team.wins}
                            </div>
                            <div className="text-[10px] text-white/30 uppercase">Wins</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[14px] font-semibold tabular-nums text-white">
                              {team.podiums}
                            </div>
                            <div className="text-[10px] text-white/30 uppercase">Podiums</div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="flex items-baseline justify-end gap-2">
                            <span className="text-[18px] font-bold tabular-nums text-white">
                              {team.points}
                            </span>
                            {indicator && (
                              <span
                                className={cn(
                                  'flex items-center gap-0.5 text-[12px] font-medium',
                                  indicator.color
                                )}
                              >
                                {indicator.icon}
                                {team.points_change !== undefined && team.points_change !== 0 && (
                                  <span>{Math.abs(team.points_change)}</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/40">PTS</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
              <p className="text-[14px] text-white/40">No standings found for {selectedYear}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export { TeamStandings };
export default TeamStandings;
