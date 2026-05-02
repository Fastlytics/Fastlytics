import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, MoveDiagonal, GripHorizontal } from 'lucide-react';
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
  icon,
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
        'absolute pointer-events-auto flex flex-col font-sans bg-[#0e0e12]/92 backdrop-blur-xl',
        'border border-white/[0.06] rounded-xl overflow-hidden',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        'transition-shadow',
        activeInteraction && 'shadow-[0_16px_48px_rgba(0,0,0,0.6)] ring-1 ring-white/10 z-50',
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
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2',
          'border-b border-white/[0.04] bg-white/[0.02]',
          activeInteraction === 'drag' ? 'cursor-grabbing' : 'cursor-grab',
          'select-none'
        )}
        data-drag-handle
        onPointerDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={12} className="text-white/50" />
          {icon && <span className="text-white/85">{icon}</span>}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {onClose && (
            <button
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn('flex-1 overflow-hidden', !noPadding && 'p-3')}>{children}</div>

      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5"
        onPointerDown={handleResizeStart}
        title="Resize"
      >
        <MoveDiagonal size={10} className="text-white/55 rotate-90" />
      </div>
    </div>
  );
};

export default WidgetShell;
