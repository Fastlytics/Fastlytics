import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  REPLAY_WIDGET_MIN_HEIGHT,
  REPLAY_WIDGET_MIN_WIDTH,
  WidgetBounds,
  WidgetLayout,
} from '@/hooks/useReplayWidgets';

interface WidgetShellProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  layout: WidgetLayout;
  bounds: WidgetBounds;
  onUpdateLayout: (updates: Partial<WidgetLayout>) => void;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
  noPadding?: boolean;
}

type InteractionSession =
  | {
      type: 'drag';
      startX: number;
      startY: number;
      initX: number;
      initY: number;
    }
  | {
      type: 'resize';
      startX: number;
      startY: number;
      initX: number;
      initY: number;
      initWidth: number;
      initHeight: number;
    };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const WidgetShell: React.FC<WidgetShellProps> = ({
  title,
  layout,
  bounds,
  onUpdateLayout,
  onClose,
  className,
  children,
  noPadding = false,
}) => {
  const interactionRef = useRef<InteractionSession | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<'drag' | 'resize' | null>(null);

  useEffect(() => {
    if (!activeInteraction) return;

    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const deltaX = event.clientX - interaction.startX;
      const deltaY = event.clientY - interaction.startY;

      if (interaction.type === 'drag') {
        const nextX = clamp(interaction.initX + deltaX, bounds.minX, bounds.maxX - layout.width);
        const nextY = clamp(interaction.initY + deltaY, bounds.minY, bounds.maxY - layout.height);
        onUpdateLayout({ x: nextX, y: nextY });
        return;
      }

      const nextWidth = clamp(
        interaction.initWidth + deltaX,
        REPLAY_WIDGET_MIN_WIDTH,
        bounds.maxX - interaction.initX
      );
      const nextHeight = clamp(
        interaction.initHeight + deltaY,
        REPLAY_WIDGET_MIN_HEIGHT,
        bounds.maxY - interaction.initY
      );

      onUpdateLayout({ width: nextWidth, height: nextHeight });
    };

    const handlePointerEnd = () => {
      interactionRef.current = null;
      setActiveInteraction(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [activeInteraction, bounds, layout.height, layout.width, onUpdateLayout]);

  const handleDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('button')) return;

      event.preventDefault();
      event.stopPropagation();

      interactionRef.current = {
        type: 'drag',
        startX: event.clientX,
        startY: event.clientY,
        initX: layout.x,
        initY: layout.y,
      };
      setActiveInteraction('drag');
    },
    [layout.x, layout.y]
  );

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      interactionRef.current = {
        type: 'resize',
        startX: event.clientX,
        startY: event.clientY,
        initX: layout.x,
        initY: layout.y,
        initWidth: layout.width,
        initHeight: layout.height,
      };
      setActiveInteraction('resize');
    },
    [layout.height, layout.width, layout.x, layout.y]
  );

  return (
    <div
      className={cn(
        'absolute pointer-events-auto flex flex-col font-sans',
        'bg-[#111113]/95 backdrop-blur-md',
        'border border-white/[0.07] rounded-lg overflow-hidden',
        'shadow-[0_4px_24px_rgba(0,0,0,0.5)]',
        activeInteraction && 'shadow-[0_8px_40px_rgba(0,0,0,0.7)] border-white/[0.12] z-50',
        className
      )}
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${layout.x}px, ${layout.y}px, 0)`,
        width: layout.width,
        height: layout.height,
        touchAction: 'none',
      }}
    >
      {/* Header — minimal, no icons */}
      <div
        className={cn(
          'flex items-center justify-between px-3 h-8 shrink-0',
          'border-b border-white/[0.05]',
          activeInteraction === 'drag' ? 'cursor-grabbing' : 'cursor-grab',
          'select-none'
        )}
        data-drag-handle
        onPointerDown={handleDragStart}
      >
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/50">
          {title}
        </span>
        {onClose && (
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-0.5 rounded hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-h-0 overflow-hidden', !noPadding && 'p-2.5')}>{children}</div>

      {/* Resize handle — subtle corner indicator */}
      <div
        className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize"
        onPointerDown={handleResizeStart}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          className="absolute bottom-1 right-1 text-white/20"
        >
          <path d="M7 1L1 7M7 4L4 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export default WidgetShell;
