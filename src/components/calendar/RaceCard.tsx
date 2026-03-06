import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Flag01Icon,
  Calendar01Icon,
  FlashIcon,
  Location01Icon,
  ChampionIcon,
  UserGroupIcon,
  Clock01Icon,
} from 'hugeicons-react';
import { ScheduleEvent, RaceResult } from '@/lib/api';

interface RaceCardProps {
  event: ScheduleEvent;
  result?: RaceResult;
  isUpcoming: boolean;
  isTesting?: boolean;
  isSprint: boolean;
  countryCode?: string;
  displayLocation?: string;
  displayDate: string;
  selectedYear: number;
  nextSession?: { name: string; date: Date };
}

const RaceCard: React.FC<RaceCardProps> = ({
  event,
  result,
  isUpcoming,
  isTesting = false,
  isSprint,
  countryCode,
  displayLocation,
  displayDate,
  selectedYear,
  nextSession,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => {
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
      }}
      className={`group cursor-pointer h-full flex flex-col relative overflow-hidden bg-black border-2 transition-colors duration-300 ${
        isTesting
          ? 'border-blue-600/60 hover:border-blue-500'
          : 'border-gray-800 hover:border-red-600'
      } ${!isUpcoming && !result && !isTesting ? 'opacity-50 hover:opacity-100' : ''}`}
    >
      {/* Status Badge - Moved to Bottom Right */}
      <div
        className={`absolute bottom-0 right-0 px-3 py-1 text-xs font-bold uppercase tracking-wider z-10 ${
          isTesting
            ? 'bg-blue-600 text-white'
            : isUpcoming
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400'
        }`}
      >
        {isTesting ? 'Testing' : isUpcoming ? 'Upcoming' : 'Finished'}
      </div>

      <div className="p-6 flex-grow flex flex-col relative z-0">
        {/* Header: Flag & Round */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-10 bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden">
              {countryCode && (
                <img
                  src={`https://flagcdn.com/h40/${countryCode}.png`}
                  alt={event.Country || event.Location}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              )}
            </div>
            {/* Sprint Text Indicator */}
            {isSprint && !isTesting && (
              <span className="text-yellow-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                <FlashIcon className="w-3 h-3" /> Sprint
              </span>
            )}
          </div>
          <div className="text-right">
            {isTesting ? (
              <div className="text-xs font-sans text-blue-300 uppercase">Pre-Season</div>
            ) : (
              <>
                <div className="text-xs font-sans text-gray-500 uppercase">Round</div>
                <div className="text-xl font-black text-white leading-none">
                  {event.RoundNumber}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Event Name */}
        <h3
          className={`font-black text-2xl uppercase italic tracking-tighter text-white mb-4 transition-colors leading-none ${
            isTesting ? 'group-hover:text-blue-400' : 'group-hover:text-red-500'
          }`}
        >
          {event.EventName}
        </h3>

        {/* Location & Date */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Location01Icon className={`w-4 h-4 ${isTesting ? 'text-blue-400' : 'text-red-600'}`} />
            <span className="font-sans uppercase tracking-wide">
              {displayLocation || event.Location || event.Country || 'Testing Venue'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar01Icon className={`w-4 h-4 ${isTesting ? 'text-blue-400' : 'text-red-600'}`} />
            <span className="font-sans uppercase tracking-wide">{displayDate}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-800 w-full mb-6" />

        {/* Content: Results or Schedule */}
        <div className="mt-auto pb-6">
          {isTesting ? (
            <div className="flex items-center gap-2 text-xs text-blue-300 font-sans uppercase">
              <Flag01Icon className="w-3 h-3" />
              <span>Testing Session Data</span>
            </div>
          ) : isUpcoming ? (
            // Upcoming: Simplified Display (No Times)
            <div className="flex items-center gap-2 text-xs text-blue-400 font-sans uppercase">
              <Clock01Icon className="w-3 h-3" />
              <span>Upcoming Event</span>
            </div>
          ) : result?.podium ? (
            // Finished with Podium Data
            <div className="space-y-2">
              {result.podium.slice(0, 3).map((p) => (
                <div
                  key={p.position}
                  className="flex items-center justify-between text-sm group/podium"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-sans font-black w-4 text-center ${
                        p.position === 1
                          ? 'text-yellow-500'
                          : p.position === 2
                            ? 'text-gray-300'
                            : 'text-amber-700'
                      }`}
                    >
                      {p.position}
                    </span>
                    <span className="font-bold text-gray-300 group-hover/podium:text-white transition-colors uppercase tracking-tight">
                      {p.driver}
                    </span>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: `var(--color-f1-${p.teamColor})` }}
                    title={p.team}
                  />
                </div>
              ))}
            </div>
          ) : result ? (
            // Finished with only Winner Data (Fallback)
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChampionIcon className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-white uppercase tracking-tight">
                  {result.driver}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                <UserGroupIcon className="w-3 h-3" />
                <span className="uppercase">{result.team}</span>
              </div>
            </div>
          ) : (
            // Finished but no data
            <div className="text-center py-2">
              <span className="text-gray-600 font-sans text-xs uppercase">Results Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Bar */}
      <div
        className={`h-1 w-0 group-hover:w-full transition-all duration-300 absolute bottom-0 left-0 z-20 ${
          isTesting ? 'bg-blue-500' : 'bg-red-600'
        }`}
      />
    </motion.div>
  );
};

export { RaceCard };
export default RaceCard;
