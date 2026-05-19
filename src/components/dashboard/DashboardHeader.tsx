import { useState, useEffect, useCallback, useRef } from 'react';
import { m } from 'motion/react';
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

  const calcTimeLeftRef = useRef(calcTimeLeft);
  useEffect(() => {
    calcTimeLeftRef.current = calcTimeLeft;
  }, [calcTimeLeft]);

  useEffect(() => {
    if (!nextSession?.date) return;
    const id = setInterval(() => setTimeLeft(calcTimeLeftRef.current()), 1000);
    return () => clearInterval(id);
  }, [nextSession]);

  const handleSessionClick = () => {
    if (!nextSession) return;
    navigate(`/race/${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="mb-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: title */}
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white/90">Race Desk</h1>
          {favoriteDriverName && (
            <p className="mt-1 text-[13px] text-white/50">
              Following <span className="text-white/80">{favoriteDriverName}</span>
            </p>
          )}
        </div>

        {/* Right: next session countdown */}
        {nextSession && (
          <button
            type="button"
            onClick={handleSessionClick}
            className="group flex items-center gap-4 text-left transition-opacity hover:opacity-80"
          >
            <div className="text-right">
              <div className="text-[12px] font-medium text-white/40">Next up</div>
              <div className="text-[13px] text-white/70">{nextSession.sessionName}</div>
            </div>

            {timeLeft ? (
              <div className="flex items-baseline gap-1">
                <span className="font text-[20px] tabular-nums text-white/90">
                  {timeLeft.d > 0 && `${timeLeft.d}d `}
                  {timeLeft.h.toString().padStart(2, '0')}
                </span>
                <span className="font text-[20px] tabular-nums text-white/40">:</span>
                <span className="font text-[20px] tabular-nums text-white/90">
                  {timeLeft.m.toString().padStart(2, '0')}
                </span>
                <span className="font text-[20px] tabular-nums text-white/40">:</span>
                <span className="font text-[20px] tabular-nums text-red-400">
                  {timeLeft.s.toString().padStart(2, '0')}
                </span>
              </div>
            ) : (
              <span className="font text-[14px] font-medium text-emerald-400">Live now</span>
            )}
          </button>
        )}
      </div>
    </m.div>
  );
};

export default DashboardHeader;
