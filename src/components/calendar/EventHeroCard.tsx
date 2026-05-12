import { useCallback, useEffect, useState } from 'react';
import { m } from 'motion/react';
import { CARD_CONTAINER, CARD_LABEL, CARD_DATA_VALUE } from '@/lib/card-styles';

interface EventHeroCardProps {
  title: string;
  displayDate: string;
  location: string;
  countryCode?: string;
  roundNumber: number;
  isSprint?: boolean;
  nextSession?: { name: string; date: Date } | null;
  onClick?: () => void;
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
    return <span className="text-[12px] font-medium text-emerald-400">Live now</span>;
  }

  return (
    <div className="flex items-baseline gap-1.5">
      {(['d', 'h', 'm', 's'] as const).map((unit, i) => (
        <span key={unit} className="flex items-baseline gap-0.5">
          {i > 0 && <span className="text-white/50">:</span>}
          <span className={CARD_DATA_VALUE}>{timeLeft[unit].toString().padStart(2, '0')}</span>
          <span className="text-[10px] text-white/80">{unit}</span>
        </span>
      ))}
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
        className={`${CARD_CONTAINER} cursor-pointer border-white/[0.08] p-5 transition-colors hover:border-white/[0.12]`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Next indicator */}
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-amber-400" />
              <span className="text-[12px] font-medium text-amber-400">Next Race</span>
            </div>

            {/* Event name */}
            <h2 className="mb-2 text-[18px] font-medium tracking-[-0.01em] text-white">{title}</h2>

            {/* Location · Date */}
            <div className="flex items-center gap-2 text-[13px] text-white/80">
              {countryCode && (
                <img
                  src={`https://flagcdn.com/${countryCode}.svg`}
                  alt={location}
                  className="h-3 rounded-[1px]"
                />
              )}
              <span>{location}</span>
              <span className="text-white/50">·</span>
              <span className="font-mono text-white/80">{displayDate}</span>
            </div>
          </div>

          {/* Right side: round + sprint badge */}
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-[12px] text-white/80">R{roundNumber}</span>
            {isSprint && <span className="text-[11px] text-white/80">Sprint</span>}
          </div>
        </div>

        {/* Countdown row */}
        {nextSession && (
          <div className="mt-4 flex items-center gap-3 border-t border-white/[0.04] pt-4">
            <span className={CARD_LABEL}>{nextSession.name}</span>
            <Countdown targetDate={nextSession.date} />
          </div>
        )}
      </div>
    </m.div>
  );
};

export default EventHeroCard;
