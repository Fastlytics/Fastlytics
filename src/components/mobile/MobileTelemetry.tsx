import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn, formatTime } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTelemetryThrottle,
  fetchTelemetryBrake,
  fetchTelemetryRPM,
  fetchTelemetryDRS,
  fetchTelemetrySpeed,
  fetchGearShiftMap,
  fetchLapTimes,
  ThrottleDataPoint,
  BrakeDataPoint,
  RPMDataPoint,
  DRSDataPoint,
  SpeedDataPoint,
  GearShiftMapData,
  DetailedRaceResult,
} from '@/lib/api';
import { LoadingSpinnerF1 } from '@/components/ui/LoadingSpinnerF1';
import { driverColor } from '@/lib/driverColor';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardSpeed02Icon,
  Settings01Icon,
  ArrowRight01Icon,
  ZapIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import type { CustomTooltipProps } from '@/types';

type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gear';

type ChartConfig = {
  label: string;
  unit: string;
  domain: number[];
};

type TooltipState = {
  isTooltipActive: boolean;
  activePayload?: Array<{
    distance?: number;
    value?: number;
  }>;
  activeLabel?: string;
  activeTooltipIndex?: number;
};

type ChartClickEvent = {
  value?: string;
};

type TouchMoveEvent = {
  isTooltipActive: boolean;
  activePayload?: Array<{
    distance?: number;
    value?: number;
  }>;
  activeLabel?: string;
  activeTooltipIndex?: number;
};

type ClickEvent = {
  value?: string;
};

interface MobileTelemetryProps {
  year: number;
  event: string;
  session: string;
  raceResults?: DetailedRaceResult[];
}

// --- Gear Map Helpers ---
const gearColors = [
  '#33bbee', // 1st
  '#ee7733', // 2nd
  '#009988', // 3rd
  '#cc3311', // 4th
  '#ee3377', // 5th
  '#0077bb', // 6th
];

const MobileTelemetry: React.FC<MobileTelemetryProps> = ({ year, event, session, raceResults }) => {
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const [activePayload, setActivePayload] = useState<TooltipState['activePayload']>([]);
  const [activeLabel, setActiveLabel] = useState<TooltipState['activeLabel']>('');
  const [activeTooltipIndex, setActiveTooltipIndex] =
    useState<TooltipState['activeTooltipIndex']>(undefined);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [showMobileTooltip, setShowMobileTooltip] = useState(false);

  // --- Data Fetching ---
  const defaultDriverCode = raceResults?.[0]?.driverCode;
  const {
    data: chartData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['mobileTelemetry', year, event, session, defaultDriverCode],
    queryFn: async () => {
      if (!defaultDriverCode) {
        return [];
      }
      return fetchLapTimes(year, event, session, [defaultDriverCode]);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    enabled: !!year && !!event && !!session && !!defaultDriverCode,
  });

  // --- Chart Configuration ---
  const config: ChartConfig = useMemo(() => {
    switch (session) {
      case 'speed':
        return { label: 'Speed', unit: 'km/h', domain: [150, 270] };
      case 'throttle':
        return { label: 'Throttle', unit: '%', domain: [0, 100] };
      case 'brake':
        return { label: 'Brake', unit: '%', domain: [0, 100] };
      case 'rpm':
        return { label: 'RPM', unit: '', domain: [0, 13000] };
      case 'drs':
        return { label: 'DRS', unit: '', domain: [0, 50] };
      default:
        return { label: 'Laps', unit: '', domain: [] };
    }
  }, [session]);

  // --- Telemetry Data ---
  const telemetryData = useMemo(() => {
    if (!chartData || isLoading) return [];
    const points = chartData.laps || [];

    return points.map((point) => ({
      Distance: point.Distance || 0,
      value: point.speed || 0,
    }));
  }, [chartData, isLoading]);

  // --- Handler Functions ---
  const handleMouseMove = (e: TouchMoveEvent) => {
    if (!isTooltipActive) {
      setShowMobileTooltip(true);
      return;
    }

    const payload = e.activePayload;
    if (!payload || payload.length === 0) {
      setIsTooltipActive(false);
      setActivePayload([]);
      setActiveLabel('');
      setActiveTooltipIndex(undefined);
      return;
    }

    const firstPoint = payload[0];
    if (firstPoint) {
      setActivePayload(payload);
      setActiveLabel('Distance');
      setActiveTooltipIndex(0);
      setIsTooltipActive(true);
    }
  };

  const handleMouseLeave = () => {
    setShowMobileTooltip(false);
    setTimeout(() => {
      setIsTooltipActive(false);
      setActivePayload([]);
      setActiveLabel('');
      setActiveTooltipIndex(undefined);
    }, 150);
  };

  const handleClick = (e: ClickEvent) => {
    logger.debug('Chart clicked:', e.value);
    if (!activePayload || activePayload.length === 0) {
      return;
    }

    const firstPoint = activePayload[0];
    if (firstPoint) {
      setSelectedDataPoint({
        distance: activeLabel,
        value: firstPoint.value,
      });
    }
  };

  if (isLoading || !chartData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-black">
        <LoadingSpinnerF1 />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/90 border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-black text-white">Mobile Telemetry</h1>
          <ZapIcon onClick={() => setShowMobileTooltip(false)} className="cursor-pointer" />
        </div>
      </div>

      {/* Telemetry Card */}
      <div className="p-4 mt-16">
        <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {year} {event}
            </h2>
            <Avatar src={getDriverImage(selectedDriver)} />
          </div>

          {/* Telemetry Chart */}
          <ResponsiveContainer width="100%" height={300} className="export-chart-container">
            <LineChart
              data={telemetryData}
              margin={{ top: 20, right: 0, left: -15, bottom: 0 }}
              className="chart-main-container"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis
                type="number"
                dataKey="Distance"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'Geist' }}
                domain={config.domain}
                hide
              />
              <YAxis
                dataKey="value"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'Geist' }}
                domain={config.domain}
                width={50}
              />
              <Tooltip
                content={() => {
                  if (!isTooltipActive || !activePayload || !activePayload.length) return null;
                  return (
                    <div className="bg-black/95 border border-gray-800 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar src={getDriverImage(activePayload[0]?.value || '')} />
                        <div>
                          <p className="text-xs text-gray-400">{activeLabel}</p>
                          <p className="text-lg font-bold text-white">{activePayload[0]?.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                }}
                cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={driverColor(selectedDriver, year)}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 1,
                  stroke: '#fff',
                  fill: driverColor(selectedDriver, year),
                }}
                name={selectedDriver}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Mobile Tooltip */}
          {showMobileTooltip && isTooltipActive && activePayload && activePayload.length > 0 && (
            <div className="fixed bottom-20 left-1/2 right-1/2 bg-black/95 border border-gray-800 rounded-xl p-4 z-50 mx-2">
              <div className="flex items-center gap-3 mb-2">
                <Avatar src={getDriverImage(activePayload[0]?.value || '')} />
                <div>
                  <p className="text-xs text-gray-400">{activeLabel}</p>
                  <p className="text-lg font-bold text-white">{activePayload[0]?.value}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { MobileTelemetry };
export default MobileTelemetry;
