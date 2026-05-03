import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight01Icon, Clock01Icon, FlashIcon } from 'hugeicons-react';

const HeroCountdown = ({ targetDate }: { targetDate: Date }) => {
  const calculateTimeLeft = () => {
    const difference = +targetDate - +new Date();
    if (difference > 0) {
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    }
    return { d: 0, h: 0, m: 0, s: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-2">
      {[
        { value: timeLeft.d, label: 'D' },
        { value: timeLeft.h, label: 'H' },
        { value: timeLeft.m, label: 'M' },
        { value: timeLeft.s, label: 'S', highlight: true },
      ].map((item, idx) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center">
            <div
              className={`text-2xl font-black font-sans ${item.highlight ? 'text-red-500' : 'text-white'}`}
            >
              {pad(item.value)}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">
              {item.label}
            </div>
          </div>
          {idx < 3 && <span className="-mt-3 text-xl font-bold text-gray-700">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

interface MobileEventHeroCardProps {
  eyebrow: string;
  title: string;
  displayDate: string;
  location: string;
  countryCode?: string;
  countryAlt?: string;
  roundLabel?: string;
  isSprint?: boolean;
  nextSession: { name: string; date: Date };
  ctaLabel?: string;
  onClick?: () => void;
}

export const MobileEventHeroCard: React.FC<MobileEventHeroCardProps> = ({
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
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border-2 border-red-500/50 bg-red-500/[0.04] shadow-[0_0_60px_rgba(239,68,68,0.08)]"
      onClick={onClick}
    >
      <div className="relative h-0.5 w-full bg-red-500/20">
        <div className="absolute inset-0 animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-red-500/60 to-transparent bg-[length:200%_100%]" />
      </div>

      <div className="relative p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-500">
              {eyebrow}
            </span>
          </div>
          {roundLabel && (
            <span className="text-xs font-sans uppercase text-red-400/50">{roundLabel}</span>
          )}
        </div>

        <div className="mb-4 flex items-start gap-3">
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border-2 border-red-500/20">
            {countryCode && (
              <img
                src={`https://flagcdn.com/h80/${countryCode}.png`}
                alt={countryAlt || location}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black uppercase italic leading-tight tracking-tight text-red-400">
              {title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-sans uppercase text-gray-400">{displayDate}</span>
              {isSprint && (
                <span className="flex items-center gap-0.5 rounded-sm bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-400">
                  <FlashIcon className="h-2.5 w-2.5" /> Sprint
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] font-sans uppercase tracking-wider text-white/50">
              {location}
            </div>
          </div>
        </div>

        <div className="rounded-md border-2 border-red-500/20 bg-red-500/[0.05] p-3">
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <Clock01Icon className="h-3 w-3 text-red-500" />
            <span className="text-[10px] font-sans uppercase tracking-wider text-gray-400">
              Until <span className="font-bold text-red-400">{nextSession.name}</span>
            </span>
          </div>
          <HeroCountdown targetDate={nextSession.date} />
        </div>

        {ctaLabel && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-red-500">
            <span className="text-xs font-black uppercase tracking-wider">{ctaLabel}</span>
            <ArrowRight01Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MobileEventHeroCard;
