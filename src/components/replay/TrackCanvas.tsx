import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DriverFrameState, getTrailPoints } from './replay-utils';

interface TrackCanvasProps {
  circuitLayout: string;
  trackColor: string;
  drivers: Record<string, DriverFrameState>;
  driverColors: Record<string, string>;
  driverNumbers?: Record<string, number | string>;
  selectedDriver: string | null;
  visibility: Record<string, string>;
  viewState: { scale: number; x: number; y: number };
  showHeatmap: boolean;
  heatmapSegments: { path: string; color: string }[];
  sectorMarkers: { x: number; y: number; angle: number; label: string }[];
  driverArrays: Record<string, { x: number[]; y: number[] }>;
  safeIndex: number;
  onClickDriver: (code: string) => void;
}

const TrackCanvas: React.FC<TrackCanvasProps> = ({
  circuitLayout,
  trackColor,
  drivers,
  driverColors,
  driverNumbers,
  selectedDriver,
  visibility,
  viewState,
  showHeatmap,
  heatmapSegments,
  sectorMarkers,
  driverArrays,
  safeIndex,
  onClickDriver,
}) => {
  const driverTrails = useMemo(() => {
    const trails: Record<string, { x: number; y: number; opacity: number }[]> = {};
    for (const [code] of Object.entries(drivers)) {
      if (visibility[code] === 'hidden') continue;
      const arrays = driverArrays[code.replace('_GHOST', '')];
      if (!arrays) continue;
      const trailLength = selectedDriver === code ? 20 : 8;
      trails[code] = getTrailPoints(arrays.x, arrays.y, safeIndex, trailLength);
    }
    return trails;
  }, [drivers, visibility, driverArrays, safeIndex, selectedDriver]);

  return (
    <div
      className="size-full origin-top-left will-change-transform"
      style={{
        transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
      }}
    >
      <svg
        viewBox="0 0 1000 500"
        className="size-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Track */}
        <path
          d={circuitLayout}
          fill="none"
          stroke={trackColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-200 ease-in-out"
        />
        <path
          d={circuitLayout}
          fill="none"
          stroke="#2a2a2e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 4"
          className="opacity-30"
        />

        {/* Heatmap */}
        {showHeatmap &&
          heatmapSegments.map((seg) => (
            <path
              key={`hm-${seg.path.substring(0, 12)}`}
              d={seg.path}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          ))}

        {/* Sector Markers */}
        {sectorMarkers.map((marker) => {
          const lineLen = 18;
          const dx = Math.cos((marker.angle * Math.PI) / 180) * lineLen;
          const dy = Math.sin((marker.angle * Math.PI) / 180) * lineLen;
          const isSF = marker.label === 'S/F';
          return (
            <g key={marker.label} className="opacity-70">
              <line
                x1={marker.x - dx}
                y1={marker.y - dy}
                x2={marker.x + dx}
                y2={marker.y + dy}
                stroke={isSF ? '#ffffff' : '#9ca3af'}
                strokeWidth={isSF ? 3 : 2}
                strokeLinecap="round"
              />
              {isSF && (
                <line
                  x1={marker.x - dx * 0.6}
                  y1={marker.y - dy * 0.6}
                  x2={marker.x + dx * 0.6}
                  y2={marker.y + dy * 0.6}
                  stroke="#000000"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              )}
              <text
                x={marker.x + dx * 1.4}
                y={marker.y + dy * 1.4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isSF ? '#ffffff' : '#9ca3af'}
                fontSize={isSF ? 10 : 9}
                fontWeight={isSF ? 'bold' : 'normal'}
                className="select-none"
              >
                {marker.label}
              </text>
            </g>
          );
        })}

        {/* Trails */}
        {Object.entries(driverTrails).map(([code, trail]) =>
          trail.map((pt) => (
            <circle
              key={`tr-${code}-${pt.x}-${pt.y}`}
              cx={pt.x}
              cy={pt.y}
              r={2}
              fill={driverColors[code.replace('_GHOST', '')] || '#ffffff'}
              opacity={pt.opacity * 0.5}
            />
          ))
        )}

        {/* Cars */}
        {Object.entries(drivers).map(([code, car]) => {
          if (visibility[code] === 'hidden') return null;

          const color = car.color || driverColors[code] || '#ffffff';
          const isSelected = selectedDriver === code;
          const isDimmed = visibility[code] === 'out-dimmed';
          const driverNumber = driverNumbers?.[code.replace('_GHOST', '')];

          return (
            <g
              key={code}
              transform={`translate(${car.x}, ${car.y})`}
              className={cn(
                'transition-transform duration-75 ease-linear cursor-pointer pointer-events-auto',
                isDimmed && 'opacity-50'
              )}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClickDriver(code);
              }}
            >
              {isSelected && (
                <circle
                  r={12}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  className="animate-ping opacity-75"
                />
              )}

              <circle r={isSelected ? 8 : 5} fill={color} stroke="#000000" strokeWidth={1} />

              {driverNumber !== undefined && (
                <text
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000000"
                  fontSize={isSelected ? 7 : 5}
                  fontWeight="bold"
                  className="select-none"
                >
                  {String(driverNumber)}
                </text>
              )}

              {isSelected && (
                <text
                  y={-15}
                  textAnchor="middle"
                  fill={color}
                  fontSize={12}
                  fontWeight="bold"
                  className="drop-shadow-md select-none"
                >
                  {car.originalCode || code.replace('_GHOST', '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TrackCanvas;
