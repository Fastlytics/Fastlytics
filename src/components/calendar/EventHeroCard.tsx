import { useCallback, useEffect, useState } from 'react';
import { m } from 'motion/react';
import { CARD_CONTAINER } from '@/lib/card-styles';

interface EventHeroCardProps {
  title: string;
  displayDate: string;
  location: string;
  countryCode?: string;
  roundNumber?: number;
  isSprint?: boolean;
  nextSession?: { name: string; date: Date } | null;
  onClick?: () => void;
}

type TimeLeft = {
  d: number;
  h: number;
  m: number;
  s: number;
};

const CountdownUnit = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="font-mono text-[32px] leading-none tracking-tight text-white md:text-[40px]">
      {value}
    </span>
    <span className="mt-0.5 text-[11px] uppercase tracking-wider text-white/50">{label}</span>
  </div>
);

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

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [calcTimeLeft]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[14px] font-medium text-emerald-400">Session live now</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 md:gap-5">
      <CountdownUnit value={String(timeLeft.d).padStart(2, '0')} label="Days" />
      <span className="mb-5 text-[20px] font-light text-white/30 md:text-[28px]">:</span>
      <CountdownUnit value={String(timeLeft.h).padStart(2, '0')} label="Hrs" />
      <span className="mb-5 text-[20px] font-light text-white/30 md:text-[28px]">:</span>
      <CountdownUnit value={String(timeLeft.m).padStart(2, '0')} label="Min" />
      <span className="mb-5 text-[20px] font-light text-white/30 md:text-[28px]">:</span>
      <CountdownUnit value={String(timeLeft.s).padStart(2, '0')} label="Sec" />
    </div>
  );
};

const EventHeroCard: React.FC<EventHeroCardProps> = ({
  title,
  displayDate,
  location,
  countryCode,
  roundNumber,
  isSprint = false,
  nextSession,
  onClick,
}) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        onClick={onClick}
        className={`${CARD_CONTAINER} relative cursor-pointer border-white/[0.06] transition-colors hover:border-white/[0.12]`}
      >
        {/* Top accent bar */}
        <div className="h-[3px] rounded-t-lg bg-gradient-to-r from-amber-400/80 to-amber-500/80" />

        <div className="p-5 md:p-6">
          {/* Header row */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-block size-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-amber-400">
                Next Race
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isSprint && (
                <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
                  Sprint
                </span>
              )}
              {roundNumber != null && (
                <span className="font-mono text-[12px] text-white/60">
                  R{String(roundNumber).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {/* Left: event info */}
            <div className="flex-1">
              <h2 className="mb-2 text-[20px] font-medium leading-tight tracking-[-0.02em] text-white md:text-[24px]">
                {title}
              </h2>
              <div className="flex items-center gap-2 text-[14px] text-white/70">
                <span>{location}</span>
                <span className="text-white/40">·</span>
                <span className="font-mono text-white/70">{displayDate}</span>
              </div>
            </div>

            {/* Right: large flag for desktop */}
            {countryCode && (
              <div className="hidden flex-shrink-0 md:block">
                <img
                  src={`https://flagcdn.com/${countryCode}.svg`}
                  alt={location}
                  className="h-14 w-auto rounded-[3px] shadow-md"
                />
              </div>
            )}
          </div>

          {/* Countdown section */}
          {nextSession && (
            <div className="mt-5 border-t border-white/[0.06] pt-5">
              <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-white/50">
                {nextSession.name} starts in
              </p>
              <Countdown targetDate={nextSession.date} />
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
};

export default EventHeroCard;
