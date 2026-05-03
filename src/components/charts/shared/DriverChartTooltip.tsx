import React from 'react';
import { getDriverImage } from '@/utils/imageMapping';
import { driverColor } from '@/lib/driverColor';

interface DriverChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  label?: number;
  selectedDriver?: string;
  year: number;
  labelFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  valueKey: string;
  unit?: string;
  title: string;
}

export const DriverChartTooltip: React.FC<DriverChartTooltipProps> = ({
  active,
  payload,
  label,
  selectedDriver,
  year,
  labelFormatter = (v) => `${Math.round(v)}m`,
  valueFormatter = (v) => String(Math.round(v)),
  valueKey,
  unit = '',
  title,
}) => {
  if (active && payload && payload.length && selectedDriver) {
    const data = payload[0].payload;
    const headshot = getDriverImage(selectedDriver, year);
    const color = driverColor(selectedDriver, year);
    const value = data[valueKey] as number;

    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4 shadow-2xl min-w-[200px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1e] overflow-hidden border border-white/[0.08] shrink-0">
              {headshot ? (
                <img
                  src={headshot}
                  alt={selectedDriver}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[10px] text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {selectedDriver[0]}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span
                className="text-xs font-semibold text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {selectedDriver}
              </span>
              <span
                className="text-[10px] text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                DIST: {labelFormatter(label ?? 0)}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className="text-[9px] text-white uppercase tracking-wider"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {title}
            </span>
            <span
              className="text-xl font-black text-white"
              style={{ color, fontFamily: "'Inter', sans-serif" }}
            >
              {valueFormatter(value)}
              {unit && <span className="text-xs text-white">{unit}</span>}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
