import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCountryCode } from '@/utils/countryUtils';
import { Time01Icon, Location01Icon, Activity01Icon, ArrowRight01Icon } from 'hugeicons-react';
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
  const calculateTimeLeft = React.useCallback(() => {
    if (!nextSession?.date) return null;
    const difference = new Date(nextSession.date).getTime() - new Date().getTime();

    if (difference > 0) {
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }, [nextSession]);

  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(
    calculateTimeLeft
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!nextSession?.date) return;

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [nextSession, calculateTimeLeft]);

  return (
    <div className="mb-10">
      <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-12 border-b border-gray-800 pb-6">
        {/* Left: Compact Title */}
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="flex items-center gap-2 px-2 py-0.5 bg-red-600/10 border border-red-600/20 rounded text-red-500">
              <Activity01Icon className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Telemetry</span>
            </div>
            <span className="text-xs font-sans text-gray-500 uppercase tracking-wider">
              Season {selectedYear}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none"
          >
            Command{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">
              Center
            </span>
          </motion.h1>
        </div>

        {/* Right: Wide Horizontal Widget */}
        {nextSession && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-grow w-full cursor-pointer group"
            onClick={() =>
              navigate(
                `/race/${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`
              )
            }
          >
            <div className="relative overflow-hidden bg-gray-900/40 border border-gray-800 group-hover:border-red-600/50 transition-colors rounded-lg p-1">
              <div className="bg-black/40 backdrop-blur-sm rounded p-3 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
                {/* Event Details */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-8 rounded overflow-hidden border border-gray-700 shadow-sm shrink-0">
                    <img
                      src={`https://flagcdn.com/h40/${getCountryCode(nextSession.country || nextSession.location)}.png`}
                      alt={nextSession.country}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                      <span>Next Session</span>
                      <ArrowRight01Icon className="w-3 h-3 text-gray-700 group-hover:text-red-500 transition-colors" />
                      <span className="text-gray-400">{nextSession.location}</span>
                    </div>
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="text-lg font-black text-white uppercase truncate group-hover:text-red-500 transition-colors">
                        {nextSession.eventName}
                      </span>
                      <span className="text-sm font-bold text-red-500 uppercase whitespace-nowrap hidden sm:inline-block">
                        / {nextSession.sessionName}
                      </span>
                    </div>
                    {/* Mobile-only session name */}
                    <div className="text-xs font-bold text-red-500 uppercase sm:hidden">
                      {nextSession.sessionName}
                    </div>
                    {favoriteDriverName && (
                      <div className="text-[10px] text-gray-400 font-sans mt-1 hidden md:block">
                        Time to cheer for{' '}
                        <span className="text-white font-bold">{favoriteDriverName}</span>!
                      </div>
                    )}
                  </div>
                </div>

                {/* Countdown Strip */}
                <div className="flex items-center gap-4 bg-gray-900/80 border border-gray-800 rounded px-4 py-2 w-full md:w-auto justify-center md:justify-end">
                  <Time01Icon className="w-4 h-4 text-gray-600" />
                  {timeLeft ? (
                    <div className="flex gap-4 font-sans">
                      {['d', 'h', 'm', 's'].map((unit) => (
                        <div key={unit} className="flex items-baseline gap-1">
                          <span
                            className={`text-xl font-bold leading-none ${unit === 's' ? 'text-red-500' : 'text-white'}`}
                          >
                            {timeLeft[unit as keyof typeof timeLeft].toString().padStart(2, '0')}
                          </span>
                          <span className="text-[10px] text-gray-600 uppercase">{unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-red-500 font-bold uppercase animate-pulse text-sm">
                      Session Live
                    </span>
                  )}
                </div>
              </div>

              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-600/50 via-transparent to-transparent" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export { DashboardHeader };
export default DashboardHeader;
