import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Calendar01Icon, ChampionIcon } from 'hugeicons-react';
import MobileLayout from './MobileLayout';
import MobilePageHeader from './MobilePageHeader';
import { useCalendarData } from '@/hooks/useCalendarData';
import { ProcessedRaceEvent } from '@/lib/calendarUtils';
import MobileEventHeroCard from './MobileEventHeroCard';

const inter = { fontFamily: "'Inter', sans-serif" } as const;

interface MobileRaceCardProps {
  event: ProcessedRaceEvent;
  selectedYear: number;
  isNextRace?: boolean;
}

const MobileRaceCard: React.FC<MobileRaceCardProps> = ({
  event,
  selectedYear,
  isNextRace = false,
}) => {
  const navigate = useNavigate();
  const isCompleted = !!event.result;
  const isTesting = event.isTesting;
  const isUpcoming = event.isUpcoming && !isNextRace;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden transition-all group cursor-pointer rounded-xl ${
        isNextRace
          ? 'bg-red-500/[0.04] border-2 border-red-500/50 hover:border-red-500/70 shadow-[0_0_40px_rgba(239,68,68,0.06)]'
          : isTesting
            ? 'bg-blue-950/20 border-2 border-blue-600/50 hover:border-blue-500'
            : isCompleted
              ? 'bg-black border-2 border-white/10 hover:border-white/15'
              : 'bg-black/60 border-2 border-white/[0.04] opacity-50 hover:opacity-70 hover:border-white/[0.08]'
      }`}
      onClick={() => {
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
      }}
    >
      {/* Next race pulse bar */}
      {isNextRace && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500/30">
          <div className="absolute inset-0 animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/60 to-transparent bg-[length:200%_100%]" />
        </div>
      )}

      <div className="p-3.5">
        <div className="flex items-center gap-3">
          {/* Round Number */}
          <div
            className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border-2 rounded-md ${
              isNextRace
                ? 'bg-red-600 border-red-500 text-white'
                : isTesting
                  ? 'bg-blue-600/20 border-blue-600/50'
                  : isCompleted
                    ? 'bg-zinc-900 border-white/10'
                    : 'bg-white/10 text-white/30 border-white/[0.06]'
            }`}
          >
            <span
              className={`text-xs font-black ${
                isNextRace
                  ? 'text-white'
                  : isTesting
                    ? 'text-blue-300'
                    : isCompleted
                      ? 'text-white/60'
                      : 'text-white/30'
              }`}
            >
              {isTesting ? 'T' : event.RoundNumber}
            </span>
          </div>

          {/* Flag */}
          <div
            className={`w-10 h-7 overflow-hidden flex-shrink-0 border-2 rounded-md ${
              isNextRace
                ? 'border-red-500/30'
                : isTesting
                  ? 'border-blue-600/40'
                  : isCompleted
                    ? 'border-white/10'
                    : 'border-white/[0.04]'
            }`}
          >
            {event.countryCode && (
              <img
                src={`https://flagcdn.com/h80/${event.countryCode}.png`}
                alt={event.Country || event.Location}
                className={`w-full h-full object-cover ${isUpcoming ? 'opacity-40' : ''}`}
              />
            )}
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3
                className={`font-black text-sm uppercase italic tracking-tight truncate ${
                  isNextRace
                    ? 'text-red-400'
                    : isCompleted
                      ? 'text-white'
                      : isUpcoming
                        ? 'text-white/30'
                        : 'text-white'
                }`}
              >
                {event.EventName.replace('Grand Prix', 'GP')}
              </h3>
              {!isTesting && event.isSprint && (
                <FlashIcon
                  className={`w-3 h-3 flex-shrink-0 ${isNextRace ? 'text-red-400' : isUpcoming ? 'text-yellow-500/30' : 'text-yellow-500'}`}
                />
              )}
              {isTesting && (
                <span className="text-[9px] font-black uppercase bg-blue-600/20 text-blue-300 px-1.5 py-0.5 border border-blue-600/40 rounded-sm">
                  Testing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-sans uppercase ${isCompleted ? 'text-white/50' : isNextRace ? 'text-white/50' : isUpcoming ? 'text-gray-600' : 'text-gray-500'}`}
              >
                {event.displayDate}
              </span>
              <span className={isNextRace ? 'text-red-500/20' : 'text-gray-700'}>·</span>
              <span
                className={`text-xs truncate font-sans uppercase ${isCompleted ? 'text-white/50' : isNextRace ? 'text-white/50' : isUpcoming ? 'text-gray-600' : 'text-gray-500'}`}
              >
                {event.displayLocation}
              </span>
            </div>
          </div>

          {/* Status/Result */}
          <div className="flex-shrink-0 text-right">
            {isTesting ? (
              <span className="text-[10px] font-black uppercase px-2 py-1 border-2 rounded-md bg-blue-900/20 text-blue-300 border-blue-600/40">
                Session Data
              </span>
            ) : isNextRace ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-black uppercase text-red-400">Up Next</span>
              </div>
            ) : event.result ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <ChampionIcon className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-black uppercase text-white">
                    {event.result.driver.split(' ').pop()}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 font-sans uppercase">
                  {event.result.team?.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase px-2 py-1 border-2 rounded-md bg-zinc-900/50 text-gray-600 border-white/[0.04]">
                {event.isUpcoming ? 'TBD' : '-'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MobileCalendar: React.FC = () => {
  const { selectedYear } = useSeason();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const { combinedRaceData, nextRace, nextSession, isLoading } = useCalendarData();

  const filteredRaces = useMemo(() => {
    let races = combinedRaceData;

    if (nextRace) {
      races = races.filter((r) => r.EventName !== nextRace.EventName);
    }

    if (filter === 'upcoming') return races.filter((r) => r.isUpcoming);
    if (filter === 'completed') return races.filter((r) => !r.isUpcoming);
    return races;
  }, [combinedRaceData, filter, nextRace]);

  const stats = useMemo(() => {
    const completed = combinedRaceData.filter((r) => !r.isUpcoming).length;
    const upcoming = combinedRaceData.filter((r) => r.isUpcoming).length;
    return { completed, upcoming, total: combinedRaceData.length };
  }, [combinedRaceData]);

  return (
    <MobileLayout>
      <div style={inter} className="min-h-screen bg-[#09090b] text-white">
        <MobilePageHeader />

        {/* Stats & Filters */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-500 font-sans uppercase tracking-wider">
              {selectedYear} Season
            </div>
            <div className="text-xs text-gray-500 font-sans uppercase tracking-wider bg-zinc-900 px-3 py-2 border-2 border-white/10 rounded-xl">
              {stats.completed}/{stats.total} Complete
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 bg-black p-1.5 border-2 border-white/10 rounded-xl">
            {(
              [
                { key: 'all', label: 'All Events' },
                { key: 'upcoming', label: `Upcoming (${stats.upcoming})` },
                { key: 'completed', label: `Done (${stats.completed})` },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 px-3 py-2 text-xs font-black uppercase italic transition-all rounded-lg ${
                  filter === f.key
                    ? 'bg-red-600 text-white'
                    : 'text-gray-500 hover:text-white bg-zinc-900'
                }`}
              >
                {f.key === 'all' ? 'All' : f.key === 'upcoming' ? 'Up' : 'Done'}
              </button>
            ))}
          </div>
        </div>

        {/* Next Race Hero Card */}
        {nextRace && filter !== 'completed' && (
          <div className="px-4 pb-4">
            {nextSession && (
              <MobileEventHeroCard
                eyebrow="Next Grand Prix"
                title={nextRace.EventName.replace('Grand Prix', 'GP')}
                displayDate={nextRace.displayDate}
                location={nextRace.Location}
                countryCode={nextRace.countryCode || undefined}
                countryAlt={nextRace.Country || nextRace.Location}
                roundLabel={`Round ${nextRace.RoundNumber}`}
                isSprint={nextRace.isSprint}
                nextSession={nextSession}
                ctaLabel="View Race Hub"
                onClick={() => {
                  navigate(
                    `/race/${selectedYear}-${nextRace.EventName.toLowerCase().replace(/\s+/g, '-')}`
                  );
                }}
              />
            )}
          </div>
        )}

        {/* Section Header */}
        {filteredRaces.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {filter === 'completed'
                  ? 'Completed Events'
                  : filter === 'upcoming'
                    ? 'Upcoming Events'
                    : 'All Events'}
              </span>
              <div className="h-0.5 flex-1 bg-white/10" />
            </div>
          </div>
        )}

        {/* Race List */}
        <div className="px-4 pb-6 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-zinc-900 animate-pulse border-2 border-white/5 rounded-xl"
                />
              ))}
            </div>
          ) : filteredRaces.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredRaces.map((race, index) => (
                <motion.div
                  key={`${new Date(race.EventDate).getFullYear()}-${race.RoundNumber}-${race.EventName}-${race.EventDate}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <MobileRaceCard event={race} selectedYear={selectedYear} />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-16 border-2 border-white/10 bg-zinc-900/30 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-black border-2 border-white/10 flex items-center justify-center rounded-xl">
                <Calendar01Icon className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-sm text-gray-500 font-sans uppercase">No races found</p>
              <p className="text-xs text-gray-600 mt-1 font-sans uppercase">
                Try a different filter
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export { MobileCalendar };
export default MobileCalendar;
