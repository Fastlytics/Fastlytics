import React, { useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { getMessageType } from './replay-utils';
import { cn } from '@/lib/utils';
import { useDraggable } from '@/hooks/useDraggable';

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
  const { position, isDragging, handleMouseDown } = useDraggable({ x: 16, y: 350 });

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
        'absolute z-20 w-80 max-h-64',
        isDragging ? 'cursor-grabbing' : 'cursor-default',
        'hidden md:block',
        className
      )}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-[#0c0c0e]/90 backdrop-blur border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2" data-grip>
            <GripVertical size={12} className="text-white cursor-grab" />
            <span className="text-[10px] font-normal uppercase tracking-wider text-white">
              Race Control
            </span>
          </div>
          <span className="text-[10px] font-mono font-light text-white tabular-nums">
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
                <span className="text-[10px] font-mono font-light text-white tabular-nums shrink-0 mt-0.5">
                  {formatTime(msg.time)}
                </span>
                <span className="text-[11px] text-white font-medium leading-tight break-words">
                  {msg.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RaceControlFeed;
