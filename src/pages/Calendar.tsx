import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import { useSeason } from '@/contexts/SeasonContext';
import RaceCard from '@/components/calendar/RaceCard';
import EventHeroCard from '@/components/calendar/EventHeroCard';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CARD_CONTAINER, CARD_GAP } from '@/lib/card-styles';
import PageHeader from '@/components/dashboard/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCalendar from '@/components/mobile/pages/MobileCalendar';

const CAL_SKELETON_IDS = Array.from({ length: 9 }, (_, i) => `cs-${i}`);

const Calendar = () => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileCalendar />;

  return <CalendarDesktop />;
};

const CalendarDesktop = () => {
  const navigate = useNavigate();
  const { selectedYear } = useSeason();
  const { trackPageView } = useAnalytics();
  const { combinedRaceData, nextRace, nextSession, isLoading, error } = useCalendarData();

  useEffect(() => {
    trackPageView('calendar', { year: selectedYear });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count stats for the header subtitle
  const completedCount = combinedRaceData.filter((r) => !r.isTesting && !r.isUpcoming).length;
  const totalRaces = combinedRaceData.filter((r) => !r.isTesting).length;

  return (
    <>
      <SEO
        title="Season Calendar"
        description={`Track the ${selectedYear} season calendar with race dates, session times, weekend status, and results in one place.`}
        keywords={['f1 calendar', 'f1 schedule', 'race dates', `${selectedYear} season calendar`]}
      />

      <div className="space-y-6 text-white">
        {/* Page header — matches dashboard style */}
        <PageHeader
          title="Race Calendar"
          subtitle={
            totalRaces > 0
              ? `${completedCount} of ${totalRaces} rounds complete · ${selectedYear}`
              : `${selectedYear} Season`
          }
          selectedYear={selectedYear}
          badge={
            nextSession
              ? {
                  label: `${nextSession.name} coming up`,
                  tone: 'info' as const,
                }
              : null
          }
        />

        {/* Next Race Hero */}
        {nextRace && (
          <EventHeroCard
            title={nextRace.EventName}
            displayDate={nextRace.displayDate}
            location={nextRace.Location}
            countryCode={nextRace.countryCode || undefined}
            roundNumber={nextRace.RoundNumber}
            isSprint={nextRace.isSprint}
            nextSession={nextSession}
            onClick={() =>
              navigate(
                `/race/${selectedYear}-${nextRace.EventName.toLowerCase().replace(/\s+/g, '-')}`
              )
            }
          />
        )}

        {/* Race Grid */}
        {isLoading ? (
          <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 xl:grid-cols-3`}>
            {CAL_SKELETON_IDS.map((id) => (
              <div key={id} className={`h-[280px] animate-pulse ${CARD_CONTAINER}`} />
            ))}
          </div>
        ) : error ? (
          <div className={`${CARD_CONTAINER} px-5 py-16 text-center`}>
            <p className="text-[14px] text-white/60">
              Could not load race data for {selectedYear}.
            </p>
          </div>
        ) : combinedRaceData.length > 0 ? (
          <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 xl:grid-cols-3`}>
            {combinedRaceData.map((race) => {
              const isNextRace = nextRace?.EventName === race.EventName;
              const status: 'finished' | 'upcoming' | 'next' | 'testing' = race.isTesting
                ? 'testing'
                : isNextRace
                  ? 'next'
                  : race.isUpcoming
                    ? 'upcoming'
                    : 'finished';
              return (
                <RaceCard
                  key={`${selectedYear}-${race.RoundNumber}-${race.EventName}`}
                  event={race}
                  result={race.result}
                  status={status}
                  isSprint={race.isSprint}
                  countryCode={race.countryCode}
                  displayLocation={race.displayLocation}
                  displayDate={race.displayDate}
                  selectedYear={selectedYear}
                />
              );
            })}
          </div>
        ) : (
          <div className={`${CARD_CONTAINER} px-5 py-16 text-center`}>
            <p className="text-[14px] text-white/60">No races found for {selectedYear}.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Calendar;
