import React, { useEffect, useState, useCallback } from 'react';
import { SEO } from '@/components/layout/SEO';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion } from 'motion/react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { useSeason } from '@/contexts/SeasonContext';
import RaceCard from '@/components/calendar/RaceCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCalendar } from '@/components/mobile';
import { useCalendarData } from '@/hooks/useCalendarData';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const Countdown = ({ targetDate }: { targetDate: Date }) => {
  const calcTimeLeft = useCallback(() => {
    const diff = +targetDate - +new Date();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff / (1000 * 60 * 60)) % 24),
      m: Math.floor((diff / 1000 / 60) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [calcTimeLeft]);

  if (!timeLeft) {
    return <span className="animate-pulse text-[13px] font-semibold text-emerald-400">Live</span>;
  }

  return (
    <div className="flex items-end gap-5 sm:gap-7 lg:gap-8">
      {(['d', 'h', 'm', 's'] as const).map((unit) => (
        <div key={unit} className="text-center">
          <div
            className={`text-5xl sm:text-6xl lg:text-7xl font-bold tabular-nums leading-none tracking-tight ${
              unit === 's' ? 'text-red-400' : 'text-white'
            }`}
          >
            {timeLeft[unit].toString().padStart(2, '0')}
          </div>
          <div className="mt-1.5 text-[11px] sm:text-[12px] uppercase tracking-widest text-white/40">
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
};

const Calendar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { selectedYear } = useSeason();
  const { trackPageView } = useAnalytics();
  const { combinedRaceData, nextRace, nextSession, isLoading, error } = useCalendarData();

  useEffect(() => {
    trackPageView('calendar', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isMobile) {
    return (
      <>
        <SEO
          title={`F1 Calendar ${selectedYear} - Race Schedule & Results`}
          description={`Full Formula 1 ${selectedYear} race calendar. Check race dates, times, and results for every Grand Prix.`}
          keywords={['f1 calendar', 'f1 schedule', 'race dates', `${selectedYear} f1 schedule`]}
        />
        <MobileCalendar />
      </>
    );
  }

  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title={`F1 Calendar ${selectedYear} - Race Schedule & Results`}
        description={`Full Formula 1 ${selectedYear} race calendar. Check race dates, times, and results for every Grand Prix.`}
        keywords={['f1 calendar', 'f1 schedule', 'race dates', `${selectedYear} f1 schedule`]}
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
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                </span>
                Season {selectedYear}
              </span>
            </div>
            <h1 className="text-3xl font-bold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              Race Calendar
            </h1>
            <p className="mt-1 text-[15px] text-white/50">{selectedYear} Season Overview</p>
          </motion.div>

          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        {/* Next Race Highlight */}
        {nextRace && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-10"
          >
            <div className="group cursor-pointer overflow-hidden rounded-xl border border-red-500/40 bg-red-500/[0.03] shadow-[0_0_80px_rgba(239,68,68,0.06)] transition-colors hover:border-red-500/60 hover:shadow-[0_0_80px_rgba(239,68,68,0.1)]">
              {/* Top pulse bar */}
              <div className="relative h-0.5 w-full bg-red-500/20">
                <div className="absolute inset-0 animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/60 to-transparent bg-[length:200%_100%]" />
              </div>

              <div className="flex flex-col lg:flex-row">
                {/* Left: Race Info */}
                <div className="flex-1 p-6 lg:p-8">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span className="text-[13px] font-semibold uppercase tracking-wider text-red-400">
                      Next Grand Prix
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-3">
                    <div className="h-8 w-12 shrink-0 overflow-hidden rounded border border-red-500/20">
                      {nextRace.countryCode && (
                        <img
                          src={`https://flagcdn.com/h40/${nextRace.countryCode}.png`}
                          alt={nextRace.Country || nextRace.Location}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-[13px] font-medium uppercase tracking-wider text-red-400/60">
                      Round {nextRace.RoundNumber}
                    </span>
                    {nextRace.isSprint && (
                      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[12px] font-semibold text-red-400">
                        Sprint
                      </span>
                    )}
                  </div>

                  <h2 className="mb-4 text-3xl font-bold uppercase italic tracking-[-0.025em] text-red-400 sm:text-4xl">
                    {nextRace.EventName}
                  </h2>

                  <div className="flex items-center gap-4 text-[15px] text-white/50">
                    <span className="font-medium text-white">{nextRace.displayDate}</span>
                    <span className="text-red-500/20">·</span>
                    <span>{nextRace.Location}</span>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/race/${selectedYear}-${nextRace.EventName.toLowerCase().replace(/\s+/g, '-')}`
                      )
                    }
                    className="mt-6 flex items-center gap-1.5 text-[15px] font-bold uppercase text-red-400/70 transition-colors hover:text-red-400"
                  >
                    View Race Hub
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M1 6h10M7 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Right: Countdown */}
                {nextSession && (
                  <div className="flex items-center justify-center border-t border-red-500/10 p-6 lg:border-t-0 lg:border-l lg:pl-16 lg:pr-14 lg:py-8">
                    <div className="text-center">
                      <div className="mb-5 text-[13px] font-medium uppercase tracking-wider text-white/40">
                        Until <span className="text-red-400/80">{nextSession.name}</span>
                      </div>
                      <Countdown targetDate={nextSession.date} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Race Grid */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
                <span className="text-lg text-red-400">!</span>
              </div>
              <h3 className="text-[18px] font-bold uppercase italic text-white">
                Data Unavailable
              </h3>
              <p className="mt-1 text-[14px] text-white/40">
                Could not load race data for {selectedYear}.
              </p>
            </div>
          ) : combinedRaceData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {combinedRaceData.map((race) => (
                <RaceCard
                  key={`${new Date(race.EventDate).getFullYear()}-${race.RoundNumber}-${race.EventName}-${race.EventDate}`}
                  event={race}
                  result={race.result}
                  isUpcoming={race.isUpcoming}
                  isTesting={race.isTesting}
                  isSprint={race.isSprint}
                  countryCode={race.countryCode}
                  displayLocation={race.displayLocation}
                  displayDate={race.displayDate}
                  selectedYear={selectedYear}
                  isNextRace={nextRace?.EventName === race.EventName}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
              <p className="text-[14px] text-white/40">No races found for {selectedYear}.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export { Calendar };
export default Calendar;
