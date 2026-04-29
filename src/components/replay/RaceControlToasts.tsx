import React from 'react';
import {
  Flag,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  ZapOff,
  Info,
  X,
} from 'lucide-react';
import { getMessageType } from './replay-utils';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceControlMessage {
  time: number;
  message: string;
  flag?: string;
}

interface RaceControlToastsProps {
  messages: RaceControlMessage[];
  currentTime: number;
  dismissedMessages: Set<string>;
  formatTime: (seconds: number) => string;
  onDismiss: (id: string) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Flag,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  Zap,
  ZapOff,
  Info,
};

const RaceControlToasts: React.FC<RaceControlToastsProps> = ({
  messages,
  currentTime,
  dismissedMessages,
  formatTime,
  onDismiss,
}) => {
  const visibleMessages = messages
    .filter((m) => {
      const id = `${m.time}-${m.message}`;
      return m.time <= currentTime && m.time > currentTime - 5 && !dismissedMessages.has(id);
    })
    .slice(-3)
    .reverse();

  if (visibleMessages.length === 0) return null;

  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-50">
      {visibleMessages.map((msg) => {
        const id = `${msg.time}-${msg.message}`;
        const config = getMessageType(msg);
        const Icon = ICON_MAP[config.iconName] || Info;

        return (
          <div
            key={id}
            className={cn(
              'border-l-4 p-3 rounded-r-lg shadow-2xl max-w-xl w-full',
              'animate-in fade-in slide-in-from-top-4 duration-300',
              'pointer-events-auto flex items-center gap-4',
              'bg-[#0c0c0e]/95 backdrop-blur border-y border-r border-white/[0.06]',
              config.border,
              config.color
            )}
          >
            <div
              className={cn('shrink-0 p-2 rounded-full bg-white/[0.04] border border-white/[0.06]')}
            >
              <Icon size={20} fill={config.fill ? 'currentColor' : 'none'} />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-[11px] tracking-wider uppercase opacity-80">
                  {msg.flag || config.type}
                </span>
                <span className="text-[10px] font-mono opacity-40 tabular-nums">
                  {formatTime(msg.time)}
                </span>
              </div>
              <span className="text-white/90 font-medium text-[13px] leading-tight break-words">
                {msg.message}
              </span>
            </div>

            <button
              onClick={() => onDismiss(id)}
              className="text-white/30 hover:text-white transition-colors p-1 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RaceControlToasts;
