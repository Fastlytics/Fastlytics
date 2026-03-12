import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartLineData01Icon,
  ChampionIcon,
  UserMultiple02Icon,
  Activity01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react';

const QuickLinksWidget = () => {
  const navigate = useNavigate();

  const links = [
    {
      title: 'Championship Progression',
      icon: <ChartLineData01Icon className="w-8 h-8 text-red-500" />,
      path: '/standings/progression',
      description: 'Analyse points evolution',
      active: true,
    },
    {
      title: 'All-time Stats',
      icon: <ChampionIcon className="w-8 h-8 text-yellow-500" />,
      path: '#',
      description: 'Historical records & data',
      active: false,
    },
    {
      title: 'Head-to-Head',
      icon: <UserMultiple02Icon className="w-8 h-8 text-blue-500" />,
      path: '#',
      description: 'Driver vs Driver comparison',
      active: false,
    },
    {
      title: 'Team Pace Analysis',
      icon: <Activity01Icon className="w-8 h-8 text-green-500" />,
      path: '/team-pace',
      description: 'Weekend & Season performance',
      active: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {links.map((link, index) => (
        <div
          key={index}
          onClick={() => link.active && navigate(link.path)}
          className={`bg-black border-2 border-gray-800 p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${
            link.active ? 'hover:border-red-600 cursor-pointer' : 'opacity-80 cursor-not-allowed'
          }`}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div
                className={`bg-gray-900/50 w-fit p-3 rounded-lg border border-gray-800 transition-colors ${!link.active && 'grayscale'}`}
              >
                {link.icon}
              </div>
              {!link.active ? (
                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20 uppercase tracking-widest">
                  Cooking
                </span>
              ) : (
                <ArrowRight01Icon className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
              )}
            </div>
            <h3
              className={`text-lg font-black uppercase italic tracking-tighter mb-1 transition-colors ${link.active ? 'text-white group-hover:text-red-500' : 'text-gray-400'}`}
            >
              {link.title}
            </h3>
            <p className="text-xs text-gray-500 font-sans uppercase tracking-wider">
              {link.description}
            </p>
          </div>

          {!link.active && (
            <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-gray-700">
              Coming Soon
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { QuickLinksWidget };
export default QuickLinksWidget;
