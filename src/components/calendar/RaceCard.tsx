import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { FlashIcon } from 'hugeicons-react';
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
  isNextRace?: boolean;
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
  isNextRace = false,
}) => {
  const navigate = useNavigate();
  const isFinished = !isUpcoming && !!result && !isTesting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      onClick={() => {
        navigate(`/race/${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`);
      }}
      className={`group cursor-pointer overflow-hidden rounded-xl border transition-colors ${
        isNextRace
          ? 'border-red-500/50 bg-red-500/[0.04] shadow-[0_0_40px_rgba(239,68,68,0.08)] hover:border-red-500/80 hover:shadow-[0_0_60px_rgba(239,68,68,0.12)]'
          : isFinished
            ? 'border-white/[0.1] bg-[#0c0c0e] hover:border-white/[0.15]'
            : isTesting
              ? 'border-white/[0.06] bg-[#0c0c0e] hover:border-white/[0.1]'
              : 'border-white/[0.04] bg-[#0c0c0e]/60 opacity-50 hover:opacity-70 hover:border-white/[0.08]'
      }`}
    >
      {/* Next race pulse bar */}
      {isNextRace && (
        <div className="relative h-0.5 w-full bg-red-500/20">
          <div className="absolute inset-0 animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/60 to-transparent bg-[length:200%_100%]" />
        </div>
      )}

      {/* Header */}
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${
          isNextRace ? 'border-red-500/10' : 'border-white/[0.04]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-7 w-10 shrink-0 overflow-hidden rounded border ${
              isNextRace ? 'border-red-500/20' : 'border-white/[0.06]'
            }`}
          >
            {countryCode && (
              <img
                src={`https://flagcdn.com/h40/${countryCode}.png`}
                alt={event.Country || event.Location}
                className={`h-full w-full object-cover ${isUpcoming && !isNextRace ? 'opacity-40' : 'opacity-80'} transition-opacity group-hover:opacity-100`}
              />
            )}
          </div>
          {isSprint && !isTesting && (
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                isNextRace
                  ? 'bg-red-500/15 text-red-400'
                  : isFinished
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-white/[0.04] text-white/25'
              }`}
            >
              <FlashIcon className="w-3 h-3" />
              Sprint
            </span>
          )}
        </div>
        <div className="text-right">
          {isTesting ? (
            <span
              className={`text-[11px] font-medium uppercase tracking-wider ${
                isNextRace ? 'text-red-400/50' : 'text-white/30'
              }`}
            >
              Pre-Season
            </span>
          ) : (
            <>
              <div
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  isNextRace ? 'text-red-400/50' : isFinished ? 'text-white/40' : 'text-white/20'
                }`}
              >
                Round
              </div>
              <div
                className={`text-[18px] font-bold tabular-nums leading-none ${
                  isNextRace ? 'text-red-400' : isFinished ? 'text-white' : 'text-white/40'
                }`}
              >
                {event.RoundNumber}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Event Name */}
        <h3
          className={`mb-1 text-[18px] font-bold uppercase transition-colors ${
            isNextRace
              ? 'text-red-400'
              : isFinished
                ? 'text-white group-hover:text-red-400'
                : 'text-white/35 group-hover:text-white/50'
          }`}
        >
          {event.EventName}
        </h3>

        {/* Location & Date */}
        <div
          className={`mb-5 flex items-center gap-2 text-[13px] ${
            isFinished ? 'text-white/50' : isNextRace ? 'text-white/50' : 'text-white/25'
          }`}
        >
          <span>{displayLocation || event.Location || event.Country || 'Testing Venue'}</span>
          <span className={isNextRace ? 'text-red-500/20' : 'text-white/15'}>·</span>
          <span>{displayDate}</span>
        </div>

        {/* Divider */}
        <div className={`h-px w-full mb-4 ${isNextRace ? 'bg-red-500/10' : 'bg-white/[0.04]'}`} />

        {/* Content: Results or Status */}
        <div>
          {isTesting ? (
            <div
              className={`text-[13px] font-medium ${isFinished ? 'text-white/40' : 'text-white/25'}`}
            >
              Testing session data available
            </div>
          ) : isNextRace ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[13px] font-semibold text-red-400 uppercase tracking-wider">
                Up Next
              </span>
            </div>
          ) : isUpcoming ? (
            <div className="text-[13px] font-medium text-white/20">Upcoming</div>
          ) : result?.podium ? (
            <div className="space-y-2">
              {result.podium.slice(0, 3).map((p) => (
                <div key={p.position} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-4 text-[15px] tabular-nums font-medium ${
                        p.position === 1
                          ? 'text-amber-400'
                          : p.position === 2
                            ? 'text-white/60'
                            : 'text-amber-700'
                      }`}
                    >
                      {p.position}
                    </span>
                    <span className="text-[14px] font-semibold text-white">{p.driver}</span>
                  </div>
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--color-f1-${p.teamColor})` }}
                    title={p.team}
                  />
                </div>
              ))}
            </div>
          ) : result ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white">{result.driver}</span>
              </div>
              <span className="text-[12px] text-white/50">{result.team}</span>
            </div>
          ) : (
            <div className="text-[13px] font-medium text-white/20">Results pending</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export { RaceCard };
export default RaceCard;
