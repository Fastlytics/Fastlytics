// knip-ignore
import React, { useEffect } from 'react';

const CAL_SKELETON_IDS = Array.from({ length: 9 }, (_, i) => `cs-${i}`);

import { m } from 'motion/react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { useSeason } from '@/contexts/SeasonContext';
import RaceCard from '@/components/calendar/RaceCard';
import EventHeroCard from '@/components/calendar/EventHeroCard';
import { useCalendarData } from '@/hooks/useCalendarData';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const Calendar = () => {
  const navigate = useNavigate();
  const { selectedYear } = useSeason();
  const { trackPageView } = useAnalytics();
  const { combinedRaceData, nextRace, nextSession, isLoading, error } = useCalendarData();

  useEffect(() => {
    trackPageView('calendar', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={inter} className="min-h-screen bg-[#09090b] text-white selection:bg-red-500/20">
      <SEO
        title="Season Calendar"
        description={`Track the ${selectedYear} season calendar with race dates, session times, weekend status, and results in one place.`}
        keywords={['f1 calendar', 'f1 schedule', 'race dates', `${selectedYear} season calendar`]}
      />
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.07] px-3 py-1 text-[14px] font-bold text-red-400">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
                </span>
                Season {selectedYear}
              </span>
            </div>
            <h1 className="text-3xl font-semibold uppercase italic tracking-[-0.025em] text-white sm:text-4xl">
              Race Calendar
            </h1>
            <p className="mt-1 text-[15px] text-white/50">{selectedYear} Season Overview</p>
          </m.div>

          <div className="mt-8 h-px w-full bg-white/[0.05]" />
        </div>

        {/* Next Race Highlight */}
        {nextRace && (
          <div className="mb-10">
            <EventHeroCard
              eyebrow="Next Grand Prix"
              title={nextRace.EventName}
              displayDate={nextRace.displayDate}
              location={nextRace.Location}
              countryCode={nextRace.countryCode || undefined}
              countryAlt={nextRace.Country || nextRace.Location}
              roundLabel={`Round ${nextRace.RoundNumber}`}
              isSprint={nextRace.isSprint}
              nextSession={nextSession}
              ctaLabel="View Race Hub"
              onCtaClick={() =>
                navigate(
                  `/race/${selectedYear}-${nextRace.EventName.toLowerCase().replace(/\s+/g, '-')}`
                )
              }
            />
          </div>
        )}

        {/* Race Grid */}
        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {CAL_SKELETON_IDS.map((id) => (
                <div
                  key={id}
                  className="h-52 animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] py-16 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
                <span className="text-lg text-red-400">!</span>
              </div>
              <h3 className="text-[18px] font-semibold uppercase italic text-white">
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
                  key={`${selectedYear}-${race.RoundNumber}-${race.EventName}`}
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

export default Calendar;
