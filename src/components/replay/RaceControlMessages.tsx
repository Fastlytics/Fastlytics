import React from 'react';
import { X } from 'lucide-react';

interface RaceControlMessage {
  time: number;
  message: string;
  flag?: string;
}

interface MessageConfig {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  color: string;
  border: string;
  bg: string;
  fill: boolean;
}

interface RaceControlMessagesProps {
  messages: RaceControlMessage[];
  currentTime: number;
  dismissedMessages: Set<string>;
  replayMode: string;
  getMessageConfig: (msg: { message: string; flag?: string }) => MessageConfig;
  formatTime: (seconds: number) => string;
  onDismiss: (id: string) => void;
}

const RaceControlMessages: React.FC<RaceControlMessagesProps> = ({
  messages,
  currentTime,
  dismissedMessages,
  replayMode,
  getMessageConfig,
  formatTime,
  onDismiss,
}) => {
  if (replayMode === 'ghost') return null;

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
        const config = getMessageConfig(msg);
        const Icon = config.icon;

        return (
          <div
            key={id}
            className={`
              ${config.bg} ${config.border} ${config.color}
              border-l-4 p-3 rounded-r shadow-lg max-w-xl w-full
              animate-in fade-in slide-in-from-top-4 duration-300
              pointer-events-auto flex items-center gap-4
            `}
          >
            <div className="shrink-0 p-2 bg-black/20 rounded-full">
              <Icon size={24} fill={config.fill ? 'currentColor' : 'none'} />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-sm tracking-wider uppercase opacity-90">
                  {msg.flag || config.type}
                </span>
                <span className="text-[10px] font-mono opacity-60">{formatTime(msg.time)}</span>
              </div>
              <span className="text-white font-medium text-sm leading-tight break-words">
                {msg.message}
              </span>
            </div>

            <button
              onClick={() => onDismiss(id)}
              className="text-white/50 hover:text-white transition-colors p-1 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RaceControlMessages;
