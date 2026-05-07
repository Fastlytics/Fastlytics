import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChartType, HeroChartPoint, HeroChartSeries } from './hero-types';

const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: 'speed', label: 'SPD' },
  { type: 'throttle', label: 'THR' },
  { type: 'brake', label: 'BRK' },
  { type: 'rpm', label: 'RPM' },
];

function nearestPointIndex(points: HeroChartPoint[], mouseX: number) {
  if (points.length === 0) return 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = Math.abs(points[i].x - mouseX);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

type LandingChartProps = {
  chartSeries: HeroChartSeries[];
  lapLabel: string;
  chartTitle: string;
  chartType: ChartType;
  setChartType: (value: ChartType) => void;
  isLoading?: boolean;
};

export default function LandingChart({
  chartSeries,
  lapLabel,
  chartTitle,
  chartType,
  setChartType,
  isLoading = false,
}: LandingChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastHoverIndexRef = useRef<number | null>(null);
  const [hover, setHover] = useState<{
    series: HeroChartSeries;
    point: HeroChartPoint;
    index: number;
    pxX: number;
    pxY: number;
    containerW: number;
    containerH: number;
  } | null>(null);

  const activeSeries = chartSeries[0];

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = useMemo(
    () => (event: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !activeSeries || activeSeries.points.length === 0) return;

      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = window.requestAnimationFrame(() => {
        const rect = svg.getBoundingClientRect();
        const svgX = ((event.clientX - rect.left) / rect.width) * 600;
        const index = nearestPointIndex(activeSeries.points, svgX);
        if (lastHoverIndexRef.current === index && hover) return;
        const point = activeSeries.points[index];
        lastHoverIndexRef.current = index;
        setHover({
          series: activeSeries,
          point,
          index,
          pxX: (point.x / 600) * rect.width,
          pxY: (point.y / 220) * rect.height,
          containerW: rect.width,
          containerH: rect.height,
        });
      });
    },
    [activeSeries, hover]
  );

  const clearHover = () => {
    lastHoverIndexRef.current = null;
    setHover(null);
  };

  return (
    <div className="flex flex-1 flex-col bg-[#0c0c0e] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium uppercase tracking-wider text-white/25">
            {chartTitle}
          </span>
          <div className="flex items-center gap-0.5 rounded border border-white/[0.06] bg-white/[0.02] p-0.5">
            {CHART_TYPES.map((entry) => (
              <button
                key={entry.type}
                type="button"
                disabled={isLoading}
                onClick={() => setChartType(entry.type)}
                className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  chartType === entry.type
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[12px] tabular-nums text-white/20">{lapLabel}</span>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-lg border border-white/[0.04] bg-[#09090b]">
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.03)_45%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
        )}
        <svg
          ref={svgRef}
          viewBox="0 0 600 220"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={clearHover}
        >
          {[55, 110, 165].map((y) => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          {chartSeries.map((series) => (
            <path
              key={series.key}
              d={series.path}
              fill="none"
              stroke={series.color}
              strokeWidth={series.strokeWidth}
              opacity={series.opacity ?? 1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {hover && (
            <>
              <line
                x1={hover.point.x}
                y1={0}
                x2={hover.point.x}
                y2={220}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <circle
                cx={hover.point.x}
                cy={hover.point.y}
                r="4"
                fill={hover.series.color}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="1"
              />
            </>
          )}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 select-none whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              left: hover.pxX > hover.containerW - 90 ? hover.pxX - 84 : hover.pxX + 8,
              top: hover.pxY > hover.containerH / 2 ? hover.pxY - 28 : hover.pxY + 8,
            }}
          >
            {hover.point.label}
          </div>
        )}
      </div>
    </div>
  );
}
