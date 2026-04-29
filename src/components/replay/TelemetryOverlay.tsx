import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import SpeedSparkline from './SpeedSparkline';

interface TelemetryOverlayProps {
  driverCode: string | null;
  telemetry: {
    speed: number;
    gear: number;
    throttle: number;
    brake: number;
    drs: number;
    rpm: number;
  } | null;
  driverColor?: string;
  speedHistory?: number[];
  className?: string;
}

const TelemetryOverlay: React.FC<TelemetryOverlayProps> = ({
  driverCode,
  telemetry,
  driverColor = '#ef4444',
  speedHistory = [],
  className,
}) => {
  const [position, setPosition] = useState({ x: 16, y: 180 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(
    null
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.initX + dx),
        y: Math.max(0, dragRef.current.initY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!driverCode || !telemetry) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-grip]')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initX: position.x,
        initY: position.y,
      };
    }
  };

  const { speed, gear, throttle, brake, drs, rpm } = telemetry;

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute z-30 w-48 select-none',
        'bg-[#0c0c0e]/90 backdrop-blur border border-white/[0.06] rounded-lg overflow-hidden',
        isDragging ? 'cursor-grabbing' : 'cursor-default',
        className
      )}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with grip */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]"
        data-grip
      >
        <div className="flex items-center gap-2">
          <GripVertical size={12} className="text-white/20 cursor-grab" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            Telemetry
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: driverColor }} />
          <span className="text-[11px] font-bold text-white/70">{driverCode}</span>
        </div>
      </div>

      {/* Speed */}
      <div className="px-4 py-3 text-center border-b border-white/[0.04]">
        <div className="text-[32px] font-mono font-bold text-white tabular-nums leading-none">
          {Math.round(speed)}
        </div>
        <div className="text-[9px] font-medium uppercase tracking-wider text-white/25 mt-1">
          km/h
        </div>
        {speedHistory.length > 1 && (
          <div className="mt-2 flex justify-center">
            <SpeedSparkline speeds={speedHistory} width={160} height={30} color={driverColor} />
          </div>
        )}
      </div>

      {/* Gear & RPM */}
      <div className="grid grid-cols-2 border-b border-white/[0.04]">
        <div className="px-3 py-2 text-center border-r border-white/[0.04]">
          <div className="text-[18px] font-mono font-bold text-white/80 tabular-nums">
            {gear > 0 ? gear : 'N'}
          </div>
          <div className="text-[9px] font-medium uppercase tracking-wider text-white/20">Gear</div>
        </div>
        <div className="px-3 py-2 text-center">
          <div className="text-[14px] font-mono font-bold text-white/60 tabular-nums">
            {(rpm / 1000).toFixed(1)}k
          </div>
          <div className="text-[9px] font-medium uppercase tracking-wider text-white/20">RPM</div>
        </div>
      </div>

      {/* Throttle & Brake Bars */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Throttle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/20">
              Throttle
            </span>
            <span className="text-[9px] font-mono text-white/40 tabular-nums">
              {Math.round(throttle)}%
            </span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500/80 rounded-full transition-all duration-75"
              style={{ width: `${throttle}%` }}
            />
          </div>
        </div>

        {/* Brake */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium uppercase tracking-wider text-white/20">
              Brake
            </span>
            <span className="text-[9px] font-mono text-white/40 tabular-nums">
              {Math.round(brake)}%
            </span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500/80 rounded-full transition-all duration-75"
              style={{ width: `${brake}%` }}
            />
          </div>
        </div>
      </div>

      {/* DRS Indicator */}
      <div
        className={cn(
          'px-3 py-2 text-center border-t border-white/[0.04]',
          drs > 0 ? 'bg-emerald-500/5' : 'bg-transparent'
        )}
      >
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            drs > 0 ? 'text-emerald-400' : 'text-white/15'
          )}
        >
          DRS {drs > 0 ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
};

export default TelemetryOverlay;
