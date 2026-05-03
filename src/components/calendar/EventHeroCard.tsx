import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface EventHeroCardProps {
  eyebrow: string;
  title: string;
  displayDate: string;
  location: string;
  countryCode?: string;
  countryAlt?: string;
  roundLabel?: string;
  isSprint?: boolean;
  nextSession?: { name: string; date: Date } | null;
  ctaLabel?: string;
  onCtaClick?: () => void;
  countdownFallbackLabel?: string;
}

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

export const EventHeroCard: React.FC<EventHeroCardProps> = ({
  eyebrow,
  title,
  displayDate,
  location,
  countryCode,
  countryAlt,
  roundLabel,
  isSprint = false,
  nextSession,
  ctaLabel,
  onCtaClick,
  countdownFallbackLabel,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="group overflow-hidden rounded-xl border border-red-500/40 bg-red-500/[0.03] shadow-[0_0_80px_rgba(239,68,68,0.06)] transition-colors hover:border-red-500/60 hover:shadow-[0_0_80px_rgba(239,68,68,0.1)]">
        <div className="relative h-0.5 w-full bg-red-500/20">
          <div className="absolute inset-0 animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/60 to-transparent bg-[length:200%_100%]" />
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-6 lg:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[13px] font-semibold uppercase tracking-wider text-red-400">
                {eyebrow}
              </span>
            </div>

            <div className="mb-2 flex items-center gap-3">
              <div className="h-8 w-12 shrink-0 overflow-hidden rounded border border-red-500/20">
                {countryCode && (
                  <img
                    src={`https://flagcdn.com/h40/${countryCode}.png`}
                    alt={countryAlt || location}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              {roundLabel && (
                <span className="text-[13px] font-medium uppercase tracking-wider text-red-400/60">
                  {roundLabel}
                </span>
              )}
              {isSprint && (
                <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[12px] font-semibold text-red-400">
                  Sprint
                </span>
              )}
            </div>

            <h2 className="mb-4 text-3xl font-bold uppercase italic tracking-[-0.025em] text-red-400 sm:text-4xl">
              {title}
            </h2>

            <div className="flex items-center gap-4 text-[15px] text-white/50">
              <span className="font-medium text-white">{displayDate}</span>
              <span className="text-red-500/20">·</span>
              <span>{location}</span>
            </div>

            {ctaLabel && onCtaClick && (
              <button
                onClick={onCtaClick}
                className="mt-6 flex items-center gap-1.5 text-[15px] font-bold uppercase text-red-400/70 transition-colors hover:text-red-400"
              >
                {ctaLabel}
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
            )}
          </div>

          {(nextSession || countdownFallbackLabel) && (
            <div className="flex items-center justify-center border-t border-red-500/10 p-6 lg:border-l lg:border-t-0 lg:pl-16 lg:pr-14 lg:py-8">
              <div className="text-center">
                {nextSession ? (
                  <>
                    <div className="mb-5 text-[13px] font-medium uppercase tracking-wider text-white/40">
                      Until <span className="text-red-400/80">{nextSession.name}</span>
                    </div>
                    <Countdown targetDate={nextSession.date} />
                  </>
                ) : (
                  <div className="text-3xl font-bold uppercase italic text-red-400">
                    {countdownFallbackLabel}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventHeroCard;
