import React, { useMemo, useState } from 'react';
import type { ReplayFrame, ReplayDriverInfo } from '@/lib/api';
import { getTyreColor, getTyreShort, getGridDelta, getFlagDisplay } from './replay-utils';

interface LeaderboardProps {
  frame: ReplayFrame | null;
  driverInfo: Record<string, ReplayDriverInfo>;
  driverColors: Record<string, string>;
  selectedDriver: string | null;
  onSelectDriver: (abbr: string | null) => void;
  isRace: boolean;
}

// Column toggle keys
type ColumnKey = 'gapInterval' | 'gridDelta' | 'tyre' | 'tyreAge' | 'tyreHistory' | 'pitStops';

const DEFAULT_COLUMNS: Record<ColumnKey, boolean> = {
  gapInterval: true,
  gridDelta: true,
  tyre: true,
  tyreAge: true,
  tyreHistory: true,
  pitStops: true,
};

export function Leaderboard({
  frame,
  driverInfo,
  driverColors,
  selectedDriver,
  onSelectDriver,
  isRace,
}: LeaderboardProps) {
  const [showGap, setShowGap] = useState(true); // true = gap to leader, false = interval
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);

  // Sort drivers by position
  const sortedDrivers = useMemo(() => {
    if (!frame?.drivers) return [];
    return [...frame.drivers].sort((a, b) => {
      if (a.retired && !b.retired) return 1;
      if (!a.retired && b.retired) return -1;
      if (a.position == null) return 1;
      if (b.position == null) return -1;
      return a.position - b.position;
    });
  }, [frame]);

  if (!frame) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d0d0d]">
        <span className="text-xs font-mono text-gray-600">NO DATA</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Leaderboard</span>
          {/* Gap/Interval Toggle */}
          <button
            onClick={() => setShowGap(!showGap)}
            className="px-1.5 py-0.5 text-[9px] font-mono bg-gray-800 text-gray-400 hover:text-gray-200 rounded border border-gray-700 transition-colors"
          >
            {showGap ? 'GAP' : 'INT'}
          </button>
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-500 hover:text-gray-300"
            title="Column settings"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 p-2 min-w-[140px]">
              {(Object.entries(columns) as [ColumnKey, boolean][]).map(([key, enabled]) => (
                <label key={key} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => setColumns(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-3 h-3 accent-red-500"
                  />
                  <span className="text-[10px] font-mono text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Driver Rows */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {sortedDrivers.map((drv) => {
          const info = driverInfo[drv.abbr];
          const color = driverColors[drv.abbr] || '#888';
          const isSelected = drv.abbr === selectedDriver;
          const gridDelta = isRace ? getGridDelta(drv.position, drv.grid_position) : null;
          const flagDisplay = getFlagDisplay(drv.flag);

          return (
            <div
              key={drv.abbr}
              onClick={() => onSelectDriver(isSelected ? null : drv.abbr)}
              className={`
                flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors border-b border-gray-800/50
                ${isSelected ? 'bg-gray-800/80' : 'hover:bg-gray-800/40'}
                ${drv.retired ? 'opacity-40' : ''}
                ${drv.in_pit ? 'opacity-70' : ''}
              `}
            >
              {/* Position */}
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded ${
                  drv.position === 1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {drv.retired ? '—' : drv.in_pit ? 'PIT' : drv.position ?? '—'}
              </div>

              {/* Team Color Bar */}
              <div
                className="w-1 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />

              {/* Driver Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-200 truncate">{drv.abbr}</span>
                  {/* Fastest lap indicator */}
                  {drv.has_fastest_lap && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" title="Fastest Lap" />
                  )}
                  {/* Flag indicators */}
                  {flagDisplay && (
                    <span
                      className="text-[10px] flex-shrink-0"
                      style={{ color: flagDisplay.color }}
                      title={drv.flag || ''}
                    >
                      {flagDisplay.icon}
                    </span>
                  )}
                </div>
                {info && (
                  <div className="text-[9px] text-gray-500 truncate">{info.team}</div>
                )}
              </div>

              {/* Gap / Interval */}
              {columns.gapInterval && (
                <div className="text-[10px] font-mono text-gray-400 min-w-[48px] text-right">
                  {drv.position === 1 ? (
                    <span className="text-gray-500">LEADER</span>
                  ) : (
                    showGap ? drv.gap : drv.interval
                  ) || '—'}
                </div>
              )}

              {/* Grid Delta */}
              {columns.gridDelta && isRace && gridDelta && (
                <div
                  className="text-[10px] font-mono min-w-[24px] text-right"
                  style={{ color: gridDelta.color }}
                >
                  {gridDelta.label}
                </div>
              )}

              {/* Tyre Compound */}
              {columns.tyre && drv.compound && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 border"
                  style={{
                    backgroundColor: `${getTyreColor(drv.compound)}22`,
                    borderColor: getTyreColor(drv.compound),
                    color: getTyreColor(drv.compound),
                  }}
                  title={drv.compound}
                >
                  {getTyreShort(drv.compound)}
                </div>
              )}

              {/* Tyre Age */}
              {columns.tyreAge && drv.tyre_life != null && (
                <span className="text-[9px] font-mono text-gray-500 min-w-[16px] text-right">
                  {drv.tyre_life}L
                </span>
              )}

              {/* Tyre History */}
              {columns.tyreHistory && drv.tyre_history.length > 1 && (
                <div className="flex gap-0.5 flex-shrink-0">
                  {drv.tyre_history.map((comp, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getTyreColor(comp) }}
                      title={`Stint ${i + 1}: ${comp}`}
                    />
                  ))}
                </div>
              )}

              {/* Pit Stops */}
              {columns.pitStops && drv.pit_stops > 0 && (
                <div className="text-[9px] font-mono text-gray-500 bg-gray-800 px-1 rounded border border-gray-700 flex-shrink-0">
                  {drv.pit_stops}s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
