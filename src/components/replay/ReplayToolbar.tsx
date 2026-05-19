import React from 'react';
import { cn } from '@/lib/utils';
import { Cloud, MessageSquare, Timer, Activity, Gauge, History } from 'lucide-react';

interface ReplayToolbarProps {
  toggles: {
    weather: boolean;
    raceControl: boolean;
    sectors: boolean;
    telemetry: boolean;
    lapHistory: boolean;
    heatmap: boolean;
  };
  onToggle: {
    weather: () => void;
    raceControl: () => void;
    sectors: () => void;
    telemetry: () => void;
    lapHistory: () => void;
    heatmap: () => void;
  };
  className?: string;
}

const ReplayToolbar: React.FC<ReplayToolbarProps> = ({ toggles, onToggle, className }) => {
  const items = [
    {
      key: 'weather' as const,
      icon: Cloud,
      label: 'Weather',
      shortcut: 'W',
      active: toggles.weather,
    },
    {
      key: 'raceControl' as const,
      icon: MessageSquare,
      label: 'Messages',
      shortcut: 'R',
      active: toggles.raceControl,
    },
    {
      key: 'sectors' as const,
      icon: Timer,
      label: 'Sectors',
      shortcut: 'S',
      active: toggles.sectors,
    },
    {
      key: 'telemetry' as const,
      icon: Activity,
      label: 'Telemetry',
      shortcut: 'T',
      active: toggles.telemetry,
    },
    {
      key: 'lapHistory' as const,
      icon: History,
      label: 'Laps',
      shortcut: 'I',
      active: toggles.lapHistory,
    },
    {
      key: 'heatmap' as const,
      icon: Gauge,
      label: 'Heatmap',
      shortcut: 'H',
      active: toggles.heatmap,
    },
  ];

  return (
    <div className={cn('absolute top-20 left-6 z-30 flex flex-col gap-1.5', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={onToggle[item.key]}
          className={cn(
            'group flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all',
            'min-w-[140px]',
            item.active
              ? 'bg-white/[0.08] border-white/[0.12] text-white shadow-lg'
              : 'bg-[#0c0c0e]/80 border-white/[0.04] text-white hover:bg-white/[0.06] hover:border-white/[0.08]'
          )}
        >
          <item.icon
            size={15}
            className={cn(
              'shrink-0',
              item.active ? 'text-white' : 'text-white/50 group-hover:text-white/70'
            )}
          />
          <div className="flex flex-col items-start">
            <span
              className={cn(
                'text-[11px] font-medium leading-none',
                item.active ? 'text-white' : 'text-white/60 group-hover:text-white/80'
              )}
            >
              {item.label}
            </span>
          </div>
          <span
            className={cn(
              'ml-auto text-[9px] font-bold tabular-nums px-1 py-0.5 rounded-md',
              item.active ? 'bg-white/10 text-white/60' : 'bg-white/[0.04] text-white/30'
            )}
          >
            {item.shortcut}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ReplayToolbar;
