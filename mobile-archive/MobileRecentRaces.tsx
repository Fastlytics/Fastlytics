import React from 'react';
import { motion } from 'framer-motion';
import { ScheduleEvent } from '@/lib/api';
import { useSeason } from '@/contexts/SeasonContext';
import { useNavigate } from 'react-router-dom';
import { getCountryCode } from '@/utils/countryUtils';
import { Location01Icon, ArrowRight01Icon, Calendar03Icon } from 'hugeicons-react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MobileRecentRacesProps {
  recentRaces: ScheduleEvent[];
}

const MobileRecentRaces: React.FC<MobileRecentRacesProps> = ({ recentRaces }) => {
  const { selectedYear } = useSeason();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  if (recentRaces.length === 0) {
    return (
      <div className="bg-black border-2 border-white/10 p-6 text-center">
        <Calendar03Icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm font-mono uppercase">
          No races completed yet this season
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-2">
        <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
          <span className="w-2 h-6 bg-red-600 block"></span>
          Recent <span className="text-gray-500">Races</span>
        </h3>
        <Link
          to="/calendar"
          className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1 hover:text-white transition-colors"
        >
          Calendar <ArrowRight01Icon className="w-3 h-3" />
        </Link>
      </div>

      {/* Horizontal Scroll Cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollPaddingLeft: '16px' }}
      >
        {/* Left spacer for edge padding */}
        <div className="flex-shrink-0 w-1" />
        {recentRaces.map((race, index) => (
          <motion.div
            key={race.EventName}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              trackEvent('widget_clicked', {
                widget: 'recent_races',
                action: 'click_race',
                race: race.EventName,
              });
              navigate(
                `/race/${selectedYear}-${race.EventName.toLowerCase().replace(/\s+/g, '-')}`
              );
            }}
            className="flex-shrink-0 w-[160px] snap-start bg-black border-2 border-white/10 overflow-hidden active:scale-95 transition-transform cursor-pointer group rounded-xl"
          >
            {/* Flag & Round */}
            <div className="relative h-24 overflow-hidden border-b-2 border-white/10">
              <img
                src={`https://flagcdn.com/h120/${getCountryCode(race.Country || race.Location)}.png`}
                alt={race.Country || race.Location}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute top-2 right-2">
                <div className="text-[8px] font-black bg-white text-black px-1.5 py-0.5 uppercase tracking-wider">
                  R{race.RoundNumber}
                </div>
              </div>
            </div>

            {/* Race Info */}
            <div className="p-3 bg-zinc-900/30">
              <div className="font-black text-sm uppercase italic leading-none line-clamp-2 mb-2 h-8 flex items-center text-white">
                {race.EventName.replace('Grand Prix', 'GP')}
              </div>
              <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono uppercase border-t border-white/5 pt-2">
                <Location01Icon className="w-3 h-3 text-red-600" />
                {race.Location}
              </div>
            </div>
          </motion.div>
        ))}

        {/* View All Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: recentRaces.length * 0.1 }}
          onClick={() => navigate('/calendar')}
          className="flex-shrink-0 w-[100px] snap-start bg-zinc-900 border-2 border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-zinc-800 transition-colors group rounded-xl"
        >
          <div className="p-3 border-2 border-white/10 group-hover:bg-white group-hover:text-black transition-colors">
            <Calendar03Icon className="w-6 h-6 text-gray-500 group-hover:text-black transition-colors" />
          </div>
          <span className="text-xs font-black uppercase text-gray-500 group-hover:text-white transition-colors tracking-wider">
            View All
          </span>
        </motion.div>
        {/* Right spacer for edge padding */}
        <div className="flex-shrink-0 w-1" />
      </div>
    </div>
  );
};

export { MobileRecentRaces };
export default MobileRecentRaces;
