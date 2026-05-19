import React, { useRef, useEffect } from 'react';
import {
  Flag,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  ZapOff,
  Info,
  Clock,
} from 'lucide-react';
import { getMessageType } from './replay-utils';
import { cn } from '@/lib/utils';
import WidgetShell from './WidgetShell';
import { WidgetBounds, WidgetLayout } from '@/hooks/useReplayWidgets';

interface RaceControlMessage {
  time: number;
  message: string;
  flag?: string;
}

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; fill?: string }>
> = {
  Flag,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  ZapOff,
  Info,
};

interface RaceControlFeedProps {
  messages: RaceControlMessage[];
  currentTime: number;
  onSeek: (time: number) => void;
  layout: WidgetLayout;
  onUpdateLayout: (updates: Partial<WidgetLayout>) => void;
  bounds: WidgetBounds;
  onClose?: () => void;
}

const formatRaceTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const RaceControlFeed: React.FC<RaceControlFeedProps> = ({
  messages,
  currentTime,
  onSeek,
  layout,
  onUpdateLayout,
  bounds,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleMessages = messages.filter((m) => m.time <= currentTime);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages.length]);

  if (visibleMessages.length === 0) return null;

  return (
    <WidgetShell
      title="Race Control"
      layout={layout}
      bounds={bounds}
      onUpdateLayout={onUpdateLayout}
      onClose={onClose}
    >
      <div ref={scrollRef} className="h-full overflow-y-auto pr-1 space-y-1.5 scrollbar-hide">
        {visibleMessages.map((msg, index) => {
          const config = getMessageType(msg);
          const Icon = iconMap[config.iconName] || Info;
          const isLatest = index === visibleMessages.length - 1;

          return (
            <button
              key={`${msg.time}-${msg.message}-${index}`}
              onClick={() => onSeek(msg.time)}
              className={cn(
                'w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-all',
                'border-l-[3px]',
                isLatest ? 'bg-white/[0.05]' : 'hover:bg-white/[0.04]',
                config.border,
                'group'
              )}
            >
              <div
                className={cn(
                  'shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5',
                  'bg-black/20'
                )}
              >
                <Icon
                  size={13}
                  className={config.color}
                  fill={config.fill ? 'currentColor' : 'none'}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn('text-[9px] font-bold uppercase tracking-wider', config.color)}
                  >
                    {msg.flag || config.type}
                  </span>
                  <div className="flex items-center gap-1 text-white/30">
                    <Clock size={9} />
                    <span className="text-[10px] tabular-nums font-medium">
                      {formatRaceTime(msg.time)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-white/80 font-medium leading-snug break-words group-hover:text-white transition-colors">
                  {msg.message}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </WidgetShell>
  );
};

export default RaceControlFeed;
