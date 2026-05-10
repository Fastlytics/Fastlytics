import React, { useState, useEffect, useCallback } from 'react';
import { m } from 'motion/react';
import { getCountryCode } from '@/utils/countryUtils';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  selectedYear: number;
  nextSession?: {
    eventName: string;
    sessionName: string;
    date: string;
    location: string;
    country: string;
  };
  favoriteDriverName?: string;
}

const inter = { fontFamily: "'Inter', sans-serif" } as const;

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedYear,
  nextSession,
  favoriteDriverName,
}) => {
  const navigate = useNavigate();

  const calcTimeLeft = useCallback(() => {
    if (!nextSession?.date) return null;
    const diff = new Date(nextSession.date).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff / (1000 * 60 * 60)) % 24),
      m: Math.floor((diff / 1000 / 60) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  }, [nextSession]);

  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    calcTimeLeft
  );

  useEffect(() => {
    if (!nextSession?.date) return;
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [nextSession, calcTimeLeft]);

  const handleSessionClick = () => {
    if (!nextSession) return;
    navigate(`/race/${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div style={inter} className="mb-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: title */}
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
            Race Desk
          </h1>
          {favoriteDriverName && (
            <p className="mt-1 text-[15px] text-white/50">
              Following <span className="text-white/70">{favoriteDriverName}</span>
            </p>
          )}
        </m.div>

        {/* Right: next session card */}
        {nextSession && (
          <m.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onClick={handleSessionClick}
            className="group w-full cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 text-left transition-colors hover:border-white/[0.1] lg:w-auto"
          >
            <div className="flex items-center gap-4">
              {/* Flag */}
              <div className="h-11 w-18 shrink-0 overflow-hidden rounded-md border border-white/[0.06]">
                <img
                  src={`https://flagcdn.com/h40/${getCountryCode(nextSession.country || nextSession.location)}.png`}
                  alt={nextSession.country}
                  className="size-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-[13px] font-medium uppercase tracking-wider text-white/40">
                  Next Session
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-[16px] font-semibold text-white group-hover:text-red-400 transition-colors">
                    {nextSession.eventName}
                  </span>
                  <span className="text-[14px] uppercase text-red-400">
                    / {nextSession.sessionName}
                  </span>
                </div>
              </div>

              {/* Countdown */}
              <div className="shrink-0 border-l border-white/[0.06] pl-4">
                {timeLeft ? (
                  <div className="flex gap-3">
                    {(['d', 'h', 'm', 's'] as const).map((unit) => (
                      <div key={unit} className="text-center">
                        <div
                          className={`text-[20px] font-bold tabular-nums leading-none ${unit === 's' ? 'text-red-400' : 'text-white'}`}
                        >
                          {timeLeft[unit].toString().padStart(2, '0')}
                        </div>
                        <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
                          {unit}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="animate-pulse text-[13px] font-semibold text-emerald-400">
                    Live
                  </span>
                )}
              </div>

              {/* Arrow */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0 text-white/35 transition-colors group-hover:text-white/70"
              >
                <path
                  d="M1 7h12M8 2l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </m.button>
        )}
      </div>

      {/* Divider */}
      <div className="mt-8 h-px w-full bg-white/[0.05]" />
    </div>
  );
};

export default DashboardHeader;
