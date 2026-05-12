import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/layout/SEO';
import { useSeason } from '@/contexts/SeasonContext';
import RaceCard from '@/components/calendar/RaceCard';
import EventHeroCard from '@/components/calendar/EventHeroCard';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CARD_CONTAINER, CARD_GAP } from '@/lib/card-styles';

const CAL_SKELETON_IDS = Array.from({ length: 9 }, (_, i) => `cs-${i}`);

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
    <>
      <SEO
        title="Season Calendar"
        description={`Track the ${selectedYear} season calendar with race dates, session times, weekend status, and results in one place.`}
        keywords={['f1 calendar', 'f1 schedule', 'race dates', `${selectedYear} season calendar`]}
      />

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-[20px] font-medium tracking-[-0.01em] text-white">Race Calendar</h1>
        <p className="mt-1 text-[12px] text-white/80">{selectedYear} Season</p>
      </div>

      {/* Next Race */}
      {nextRace && (
        <div className="mb-8">
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
        </div>
      )}

      {/* Race Grid */}
      {isLoading ? (
        <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
          {CAL_SKELETON_IDS.map((id) => (
            <div key={id} className={`h-40 animate-pulse ${CARD_CONTAINER}`} />
          ))}
        </div>
      ) : error ? (
        <div className={`${CARD_CONTAINER} px-5 py-12 text-center`}>
          <p className="text-[13px] text-white/80">Could not load race data for {selectedYear}.</p>
        </div>
      ) : combinedRaceData.length > 0 ? (
        <div className={`grid grid-cols-1 ${CARD_GAP} md:grid-cols-2 lg:grid-cols-3`}>
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
        <div className={`${CARD_CONTAINER} px-5 py-12 text-center`}>
          <p className="text-[13px] text-white/80">No races found for {selectedYear}.</p>
        </div>
      )}
    </>
  );
};

export default Calendar;
