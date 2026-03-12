import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCountryCode } from '@/utils/countryUtils';
import { Activity01Icon } from 'hugeicons-react';
import { useNavigate } from 'react-router-dom';
import { useSeason } from '@/contexts/SeasonContext';

interface MobileNextSessionCardProps {
  nextSession?: {
    eventName: string;
    sessionName: string;
    date: string;
    location: string;
    country: string;
  };
}

const MobileNextSessionCard: React.FC<MobileNextSessionCardProps> = ({ nextSession }) => {
  const calculateTimeLeft = () => {
    if (!nextSession) return null;
    const now = new Date().getTime();
    const targetDate = new Date(nextSession.date).getTime();
    const difference = targetDate - now;

    if (difference <= 0) return null;

    return {
      d: Math.floor(difference / (1000 * 60 * 60 * 24)),
      h: Math.floor((difference / (1000 * 60 * 60)) % 24),
      m: Math.floor((difference / 1000 / 60) % 60),
      s: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());
  const navigate = useNavigate();
  const { selectedYear } = useSeason();

  useEffect(() => {
    if (!nextSession?.date) return;

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [nextSession]);

  return (
    <div className="space-y-6">
      {/* Next Session Card - Cyber Brutalist */}
      {nextSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black border-2 border-white/10 p-4 active:bg-zinc-900 transition-colors cursor-pointer rounded-xl"
          onClick={() =>
            navigate(
              `/race/${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`
            )
          }
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-600 animate-pulse" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Next Up
                </span>
              </div>
              <h2 className="text-xl font-black uppercase italic leading-none max-w-[200px]">
                {nextSession.eventName.replace('Grand Prix', 'GP')}
              </h2>
            </div>
            <div className="w-12 h-8 border border-white/20">
              <img
                src={`https://flagcdn.com/h80/${getCountryCode(nextSession.country || nextSession.location)}.png`}
                alt={nextSession.country}
                className="w-full h-full object-cover transition-all"
              />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-xs font-mono text-gray-400 uppercase">
                {nextSession.location}
              </div>
              <div className="text-sm font-bold text-white uppercase bg-red-600/10 px-2 py-0.5 inline-block border border-red-600/20">
                {nextSession.sessionName}
              </div>
            </div>

            {/* Countdown */}
            {timeLeft ? (
              <div className="flex items-center gap-1 font-mono text-right">
                <div className="text-center">
                  <span className="block text-lg font-black leading-none">{timeLeft.d}</span>
                  <span className="text-[8px] text-gray-500 uppercase">Day</span>
                </div>
                <span className="text-gray-600 text-lg font-light">:</span>
                <div className="text-center">
                  <span className="block text-lg font-black leading-none">
                    {String(timeLeft.h).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-gray-500 uppercase">Hr</span>
                </div>
                <span className="text-gray-600 text-lg font-light">:</span>
                <div className="text-center">
                  <span className="block text-lg font-black leading-none text-red-600">
                    {String(timeLeft.m).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] text-gray-500 uppercase">Min</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">Live Now</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* No session fallback */}
      {!nextSession && (
        <div className="bg-black border-2 border-white/10 p-6 text-center rounded-xl">
          <Activity01Icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-mono uppercase">No upcoming sessions</p>
        </div>
      )}
    </div>
  );
};

export { MobileNextSessionCard };
export default MobileNextSessionCard;
