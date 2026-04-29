import React, { useRef, useEffect } from 'react';
import { getMessageType } from './replay-utils';
import { cn } from '@/lib/utils';

interface RaceControlMessage {
  time: number;
  message: string;
  flag?: string;
}

interface RaceControlFeedProps {
  messages: RaceControlMessage[];
  currentTime: number;
  formatTime: (seconds: number) => string;
  className?: string;
}

const RaceControlFeed: React.FC<RaceControlFeedProps> = ({
  messages,
  currentTime,
  formatTime,
  className,
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
    <div
      className={cn(
        'absolute bottom-36 left-4 z-20 w-80 max-h-64',
        'bg-[#0c0c0e]/90 backdrop-blur border border-white/[0.06] rounded-lg overflow-hidden',
        'hidden md:block',
        className
      )}
    >
      <div className="px-3 py-2 border-b border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
          Race Control
        </span>
        <span className="text-[10px] font-mono text-white/20 tabular-nums">
          {visibleMessages.length}
        </span>
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-52 p-2 space-y-1">
        {visibleMessages.map((msg, index) => {
          const config = getMessageType(msg);
          const isLatest = index === visibleMessages.length - 1;

          return (
            <div
              key={`${msg.time}-${msg.message}-${index}`}
              className={cn(
                'flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors',
                'border-l-2',
                isLatest ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]',
                config.border
              )}
            >
              <span className="text-[10px] font-mono text-white/25 tabular-nums shrink-0 mt-0.5">
                {formatTime(msg.time)}
              </span>
              <span className="text-[11px] text-white/70 leading-tight break-words">
                {msg.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RaceControlFeed;
