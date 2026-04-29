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
    { key: 'weather' as const, icon: Cloud, label: 'Weather', active: toggles.weather },
    {
      key: 'raceControl' as const,
      icon: MessageSquare,
      label: 'Feed',
      active: toggles.raceControl,
    },
    { key: 'sectors' as const, icon: Timer, label: 'Sectors', active: toggles.sectors },
    { key: 'telemetry' as const, icon: Activity, label: 'Telemetry', active: toggles.telemetry },
    { key: 'lapHistory' as const, icon: History, label: 'Laps', active: toggles.lapHistory },
    { key: 'heatmap' as const, icon: Gauge, label: 'Heatmap', active: toggles.heatmap },
  ];

  return (
    <div className={cn('absolute top-[140px] left-3 z-20 flex flex-col gap-1.5', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={onToggle[item.key]}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg border transition-all',
            item.active
              ? 'bg-white/[0.08] border-white/[0.1] text-white'
              : 'bg-[#0c0c0e]/80 border-white/[0.04] text-white/30 hover:text-white/60 hover:border-white/[0.08]'
          )}
          title={`${item.label} (${item.key === 'raceControl' ? 'R' : item.key === 'heatmap' ? 'H' : item.label[0]})`}
        >
          <item.icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default ReplayToolbar;
