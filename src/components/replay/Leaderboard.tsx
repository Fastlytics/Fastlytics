import React, { useMemo, useState } from 'react';
import type { ReplayFrame, ReplayDriverInfo } from '@/lib/api';
import { getTyreColor, getTyreShort, getGridDelta, getFlagDisplay } from './replay-utils';
import { getDriverImage } from '@/utils/imageMapping';

interface LeaderboardProps {
  frame: ReplayFrame | null;
  driverInfo: Record<string, ReplayDriverInfo>;
  driverColors: Record<string, string>;
  selectedDriver: string | null;
  onSelectDriver: (abbr: string | null) => void;
  isRace: boolean;
  year: number;
  currentLap?: number;
  totalLaps?: number;
}

type ColumnKey = 'gapInterval' | 'gridDelta' | ' tyre' | ' tyreAge' | ' tyreHistory' | 'pitStops';

const DEFAULT_COLUMNS: Record<string, boolean> = {
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
  year,
  currentLap,
  totalLaps,
}: LeaderboardProps) {
  const [showGap, setShowGap] = useState(true);
  const [columns, setColumns] = useState<Record<string, boolean>>(DEFAULT_COLUMNS);
  const [showSettings, setShowSettings] = useState(false);

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
        <span className="text-xs font-sans text-white">NO DATA</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] h-full flex flex-col">
      {/* Lap Counter Header */}
      {currentLap && totalLaps ? (
        <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-sans text-white/60 uppercase tracking-wider">
              Lap
            </span>
            <span className="text-xl font-sans font-bold text-white">
              {currentLap}
              <span className="text-white/40 text-sm">/{totalLaps}</span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-sans text-white uppercase tracking-wider">
            Leaderboard
          </span>
          <button
            onClick={() => setShowGap(!showGap)}
            className="px-1.5 py-0.5 text-[9px] font-sans bg-gray-800 text-white rounded border border-gray-700 transition-colors"
          >
            {showGap ? 'GAP' : 'INT'}
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-800 rounded transition-colors text-white"
            title="Column settings"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showSettings && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 p-2 min-w-[140px]">
              {Object.entries(columns).map(([key, enabled]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => setColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="w-3 h-3 accent-red-500"
                  />
                  <span className="text-[10px] font-sans text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

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
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-bold font-sans rounded ${
                  drv.position === 1 ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
                }`}
              >
                {drv.retired ? '—' : drv.in_pit ? 'PIT' : (drv.position ?? '—')}
              </div>

              <div
                className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border-2"
                style={{ borderColor: color }}
              >
                <img
                  src={getDriverImage(drv.abbr, year)}
                  className="w-full h-full object-cover object-top"
                  alt={drv.abbr}
                />
              </div>

              <div
                className="w-1 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white font-sans truncate">
                    {drv.abbr}
                  </span>
                  {drv.has_fastest_lap && (
                    <span
                      className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"
                      title="Fastest Lap"
                    />
                  )}
                  {flagDisplay && (
                    <span
                      className="text-[10px] font-sans flex-shrink-0"
                      style={{ color: flagDisplay.color }}
                      title={drv.flag || ''}
                    >
                      {flagDisplay.icon}
                    </span>
                  )}
                </div>
                {info && (
                  <div className="text-[9px] text-white/60 font-sans truncate">{info.team}</div>
                )}
              </div>

              {columns.gapInterval && (
                <div className="text-[10px] font-sans text-white min-w-[48px] text-right">
                  {drv.position === 1 ? (
                    <span className="text-white/60">LEADER</span>
                  ) : (
                    (showGap ? drv.gap : drv.interval) || '—'
                  )}
                </div>
              )}

              {columns.gridDelta && isRace && gridDelta && (
                <div
                  className="text-[10px] font-sans min-w-[24px] text-right"
                  style={{ color: gridDelta.color }}
                >
                  {gridDelta.label}
                </div>
              )}

              {columns.tyre && drv.compound && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold font-sans flex-shrink-0 border"
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

              {columns.tyreAge && drv.tyre_life != null && (
                <span className="text-[9px] font-sans text-white/60 min-w-[16px] text-right">
                  {drv.tyre_life}L
                </span>
              )}

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

              {columns.pitStops && drv.pit_stops > 0 && (
                <div className="text-[9px] font-sans text-white/60 bg-gray-800 px-1 rounded border border-gray-700 flex-shrink-0">
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
