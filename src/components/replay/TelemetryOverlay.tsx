import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Gauge, Activity } from 'lucide-react';
import WidgetShell from './WidgetShell';
import { WidgetBounds, WidgetLayout } from '@/hooks/useReplayWidgets';
import Speedometer from './Speedometer';
import TelemetrySparkline from './TelemetrySparkline';

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
  throttleHistory?: number[];
  brakeHistory?: number[];
  rpmHistory?: number[];
  liveLapTime?: number | null;
  layout: WidgetLayout;
  onUpdateLayout: (updates: Partial<WidgetLayout>) => void;
  bounds: WidgetBounds;
  onClose?: () => void;
}

const EMPTY_HISTORY: number[] = [];

const TelemetryOverlay: React.FC<TelemetryOverlayProps> = ({
  driverCode,
  telemetry,
  driverColor = '#ef4444',
  speedHistory = EMPTY_HISTORY,
  throttleHistory = EMPTY_HISTORY,
  brakeHistory = EMPTY_HISTORY,
  rpmHistory = EMPTY_HISTORY,
  liveLapTime = null,
  layout,
  onUpdateLayout,
  bounds,
  onClose,
}) => {
  const [inputDisplay, setInputDisplay] = useState<'bars' | 'graphs'>('bars');

  if (!driverCode || !telemetry) return null;

  const { speed, gear, throttle, brake, drs, rpm } = telemetry;
  const formatLiveTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  return (
    <WidgetShell
      title={
        <span className="flex items-center gap-1.5">
          Telemetry
          <span
            className="size-2 rounded-full inline-block"
            style={{ backgroundColor: driverColor }}
          />
          <span className="text-white/75 normal-case tracking-normal font-medium">
            {driverCode}
          </span>
        </span>
      }
      icon={<Gauge size={12} className="text-white/85" />}
      layout={layout}
      bounds={bounds}
      onUpdateLayout={onUpdateLayout}
      onClose={onClose}
    >
      <div className="flex flex-col h-full gap-3 overflow-y-auto scrollbar-hide">
        {/* Speedometer */}
        <div className="flex justify-center py-1">
          <Speedometer speed={speed} maxSpeed={400} size={150} driverColor={driverColor} />
        </div>

        {liveLapTime !== null && liveLapTime >= 0 && (
          <div className="flex items-center justify-between px-0 py-0.5">
            <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
              Live Lap
            </span>
            <span className="text-[16px] font-bold text-white tabular-nums">
              {formatLiveTime(liveLapTime)}
            </span>
          </div>
        )}

        {/* Speed sparkline */}
        {speedHistory.length > 1 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
                Speed Trace
              </span>
            </div>
            <TelemetrySparkline
              data={speedHistory}
              width={layout.width - 24}
              height={40}
              color={driverColor}
            />
          </div>
        )}

        {/* Gear & RPM */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
            <span className="text-[22px] font-bold text-white tabular-nums">
              {gear > 0 ? gear : 'N'}
            </span>
            <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
              Gear
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
            <span className="text-[16px] font-bold text-white tabular-nums">
              {Math.trunc(Math.max(0, rpm)).toLocaleString('en-US')}
            </span>
            <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
              RPM
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
            Inputs
          </span>
          <div className="flex rounded-md border border-white/[0.05] bg-white/[0.02] p-0.5">
            {(['bars', 'graphs'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputDisplay(mode)}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-semibold text-white uppercase tracking-wider transition-colors',
                  inputDisplay === mode
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/65 hover:text-white'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Throttle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
              Throttle
            </span>
            <span className="text-[10px] font-semibold text-white tabular-nums">
              {Math.round(throttle)}%
            </span>
          </div>
          {inputDisplay === 'bars' ? (
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${throttle}%`,
                  backgroundColor:
                    throttle > 80 ? '#10b981' : throttle > 40 ? '#34d399' : '#6ee7b7',
                }}
              />
            </div>
          ) : throttleHistory.length > 1 ? (
            <TelemetrySparkline
              data={throttleHistory}
              width={layout.width - 24}
              height={24}
              color="#10b981"
              maxValue={100}
              minValue={0}
            />
          ) : null}
        </div>

        {/* Brake */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider">
              Brake
            </span>
            <span className="text-[10px] font-semibold text-white tabular-nums">
              {Math.round(brake)}%
            </span>
          </div>
          {inputDisplay === 'bars' ? (
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-75"
                style={{ width: `${brake}%` }}
              />
            </div>
          ) : brakeHistory.length > 1 ? (
            <TelemetrySparkline
              data={brakeHistory}
              width={layout.width - 24}
              height={24}
              color="#ef4444"
              maxValue={100}
              minValue={0}
            />
          ) : null}
        </div>

        {/* DRS */}
        <div
          className={cn(
            'flex items-center justify-center gap-2 py-2 rounded-lg border transition-all',
            drs > 0
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-white/[0.02] border-white/[0.03]'
          )}
        >
          <Activity size={12} className="text-white/80" />
          <span
            className={cn(
              'text-[11px] font-semibold text-white uppercase tracking-widest',
              drs > 0 && 'text-white'
            )}
          >
            DRS {drs > 0 ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </WidgetShell>
  );
};

export default TelemetryOverlay;
