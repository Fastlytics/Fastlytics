import React, { useEffect, useRef, useState } from 'react';
import type { ReplayFrame, ReplayRaceControl } from '@/lib/api';

interface RaceControlMessagesProps {
  frame: ReplayFrame | null;
}

interface DisplayMessage extends ReplayRaceControl {
  id: number;
  expiresAt: number;
}

let messageIdCounter = 0;

export function RaceControlMessages({ frame }: RaceControlMessagesProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const lastFrameTime = useRef<number>(-1);

  // Add new messages when frame changes
  useEffect(() => {
    if (!frame?.race_control || frame.timestamp === lastFrameTime.current) return;
    lastFrameTime.current = frame.timestamp;

    const now = Date.now();
    const newMsgs: DisplayMessage[] = frame.race_control.map((msg) => ({
      ...msg,
      id: messageIdCounter++,
      expiresAt: now + 8000, // 8 seconds
    }));

    if (newMsgs.length > 0) {
      setMessages((prev) => [...prev, ...newMsgs].slice(-5)); // Keep max 5
    }
  }, [frame]);

  // Auto-dismiss expired messages
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((m) => m.expiresAt > now));
    }, 1000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (messages.length === 0) return null;

  const getMessageStyle = (msg: DisplayMessage) => {
    const flag = (msg.flag || '').toUpperCase();
    const category = (msg.category || '').toUpperCase();
    const message = (msg.message || '').toUpperCase();

    if (flag.includes('RED') || message.includes('RED FLAG')) {
      return { bg: 'bg-red-900/90', border: 'border-red-600', text: 'text-red-200' };
    }
    if (flag.includes('YELLOW') || message.includes('SAFETY CAR') || message.includes('VSC')) {
      return { bg: 'bg-yellow-900/90', border: 'border-yellow-600', text: 'text-yellow-200' };
    }
    if (message.includes('PENALTY') || category.includes('PENALTY')) {
      return { bg: 'bg-orange-900/90', border: 'border-orange-600', text: 'text-orange-200' };
    }
    if (message.includes('INVESTIGATION') || message.includes('NOTED')) {
      return { bg: 'bg-amber-900/90', border: 'border-amber-600', text: 'text-amber-200' };
    }
    if (message.includes('DRS')) {
      return { bg: 'bg-green-900/90', border: 'border-green-600', text: 'text-green-200' };
    }
    return { bg: 'bg-gray-900/90', border: 'border-gray-600', text: 'text-gray-200' };
  };

  return (
    <div className="flex flex-col gap-1.5 max-w-[300px]">
      {messages.map((msg) => {
        const style = getMessageStyle(msg);
        return (
          <div
            key={msg.id}
            className={`
              ${style.bg} ${style.text} border ${style.border}
              backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans
              animate-in slide-in-from-right duration-300
            `}
          >
            {msg.flag && <div className="text-[9px] opacity-70 mb-0.5">{msg.flag}</div>}
            <div className="leading-tight">{msg.message}</div>
          </div>
        );
      })}
    </div>
  );
}
