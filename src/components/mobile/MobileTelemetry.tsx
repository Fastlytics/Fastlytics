import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTelemetryThrottle,
  fetchTelemetryBrake,
  fetchTelemetryRPM,
  fetchTelemetryDRS,
  fetchTelemetrySpeed,
  fetchGearShiftMap,
  ThrottleDataPoint,
  BrakeDataPoint,
  RPMDataPoint,
  DRSDataPoint,
  SpeedDataPoint,
  GearShiftMapData,
  DetailedRaceResult,
} from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
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

// --- Types ---
type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gear';
type TelemetryDataPoint =
  | ThrottleDataPoint
  | BrakeDataPoint
  | RPMDataPoint
  | DRSDataPoint
  | SpeedDataPoint;

interface MobileTelemetryProps {
  year: number;
  event: string;
  session: string;
  raceResults?: DetailedRaceResult[];
}

// --- Gear Map Helpers ---
const gearColors = [
  '#33bbee', // 1st Gear (Cyan)
  '#ee7733', // 2nd Gear (Orange)
  '#009988', // 3rd Gear (Teal)
  '#cc3311', // 4th Gear (Red)
  '#ee3377', // 5th Gear (Magenta)
  '#0077bb', // 6th Gear (Blue)
  '#aacc00', // 7th Gear (Lime Green)
  '#ffdd55', // 8th Gear (Yellow)
];

const getGearColor = (gear: number): string => {
  if (gear >= 1 && gear <= gearColors.length) {
    return gearColors[gear - 1];
  }
  return '#6B7280';
};

// --- Custom Tooltip (outside component to avoid re-creation during render) ---
interface TelemetryTooltipPayload {
  name: string;
  value: number;
  stroke: string;
}

interface TelemetryTooltipProps {
  active?: boolean;
  payload?: TelemetryTooltipPayload[];
  label?: number;
  unit: string;
}

const TelemetryChartTooltip: React.FC<TelemetryTooltipProps> = ({
  active,
  payload,
  label,
  unit,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/20 p-3 rounded-none backdrop-blur-md shadow-xl">
        <div className="text-[10px] text-gray-500 font-mono mb-2">
          DIST: {Math.round(label ?? 0)}m
        </div>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
              <span className="text-xs font-bold font-mono text-gray-300">{p.name}</span>
            </div>
            <span className="text-sm font-bold font-mono text-white">
              {Math.round(p.value)}
              {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---

const MobileTelemetry: React.FC<MobileTelemetryProps> = ({ year, event, session, raceResults }) => {
  // State
  const [telemetryType, setTelemetryType] = useState<TelemetryType>('speed');
  const defaultDriver = useMemo(() => {
    if (!raceResults || raceResults.length === 0) return '';
    const p1 = raceResults.find((r) => r.position === 1);
    return p1 ? p1.driverCode : raceResults[0].driverCode;
  }, [raceResults]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const driver = selectedDriver || defaultDriver;
  const [hoveredGear, setHoveredGear] = useState<number | null>(null);
  const [isRotated, setIsRotated] = useState(true);

  // Helpers
  const getTeamColorClass = (teamName: string | undefined): string => {
    if (!teamName) return 'gray';
    const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (simpleName.includes('mclaren')) return 'mclaren';
    if (simpleName.includes('mercedes')) return 'mercedes';
    if (simpleName.includes('redbull')) return 'redbull';
    if (simpleName.includes('ferrari')) return 'ferrari';
    if (simpleName.includes('alpine')) return 'alpine';
    if (simpleName.includes('astonmartin')) return 'astonmartin';
    if (simpleName.includes('williams')) return 'williams';
    if (simpleName.includes('haas')) return 'haas';
    if (simpleName.includes('sauber')) return 'alfaromeo';
    if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri'))
      return 'alphatauri';
    return 'gray';
  };

  const getDriverDetails = (code: string) => raceResults?.find((r) => r.driverCode === code);

  // Data Fetching
  const fetchTelemetry = async (tType: TelemetryType, drv: string) => {
    const lap = 'fastest';
    switch (tType) {
      case 'throttle':
        return fetchTelemetryThrottle(year, event, session, drv, lap);
      case 'brake':
        return fetchTelemetryBrake(year, event, session, drv, lap);
      case 'rpm':
        return fetchTelemetryRPM(year, event, session, drv, lap);
      case 'drs':
        return fetchTelemetryDRS(year, event, session, drv, lap);
      case 'speed':
        return fetchTelemetrySpeed(year, event, session, drv, lap).then((r) => r.trace);
      case 'gear':
        return fetchGearShiftMap(year, event, session, drv, lap);
      default:
        return fetchTelemetrySpeed(year, event, session, drv, lap).then((r) => r.trace);
    }
  };

  const { data: telemetryData, isLoading } = useQuery({
    queryKey: ['mobileTelemetry', telemetryType, year, event, session, driver],
    queryFn: () => fetchTelemetry(telemetryType, driver),
    enabled: !!driver,
  });

  // Data Processing
  const chartData = useMemo(() => {
    if (!telemetryData || telemetryType === 'gear') return [];
    const data = telemetryData as TelemetryDataPoint[];

    const getValueKey = (type: TelemetryType) => {
      switch (type) {
        case 'throttle':
          return 'Throttle';
        case 'brake':
          return 'Brake';
        case 'rpm':
          return 'RPM';
        case 'drs':
          return 'DRS';
        case 'speed':
          return 'Speed';
        default:
          return 'Speed';
      }
    };
    const valueKey = getValueKey(telemetryType);

    // Downsample if too many points
    const finalData = data.length > 3000 ? data.filter((_, i) => i % 2 === 0) : data;

    return finalData.map((point) => ({
      Distance: point.Distance,
      [driver]: (point as Record<string, number>)[valueKey],
    }));
  }, [telemetryData, driver, telemetryType]);

  // Stats Calculation
  const stats = useMemo(() => {
    if (telemetryType === 'gear') {
      if (!telemetryData) return null;
      const gearData = telemetryData as GearShiftMapData;
      return {
        max: gearData.stats.mostUsedGear,
        avg: gearData.stats.avgGear,
        label: 'Gear Stats',
        unit: '',
      };
    }

    if (!chartData.length) return null;
    const values = chartData
      .map((d) => d[driver] as number)
      .filter((v) => v !== null && v !== undefined);
    if (!values.length) return { max: 0, avg: 0 };
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { max, avg };
  }, [chartData, driver, telemetryData, telemetryType]);

  // Chart Config
  const getChartConfig = () => {
    switch (telemetryType) {
      case 'throttle':
        return { color: '#10b981', domain: [0, 100], unit: '%', label: 'Throttle' };
      case 'brake':
        return { color: '#ef4444', domain: [0, 100], unit: '%', label: 'Brake' };
      case 'rpm':
        return { color: '#fb923c', domain: [0, 13000], unit: 'RPM', label: 'RPM' };
      case 'drs':
        return { color: '#3b82f6', domain: [-0.1, 1.1], unit: '', label: 'DRS' };
      case 'speed':
        return { color: '#3b82f6', domain: ['auto', 'auto'], unit: 'km/h', label: 'Speed' };
      case 'gear':
        return { color: '#ffffff', domain: [0, 8], unit: '', label: 'Gear Map' };
    }
  };
  const config = getChartConfig();
  const dColor = driverColor(driver, year);

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-4">
      {/* Driver Selector */}
      <div className="mb-6 px-1">
        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block">
          Select Driver
        </label>
        <Select value={driver} onValueChange={setSelectedDriver} disabled={!raceResults}>
          <SelectTrigger className="w-full bg-black border border-white/20 text-white h-12 px-3 rounded-md">
            {driver ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="w-6 h-6 border border-white/10">
                  <AvatarImage
                    src={getDriverImage(driver, year)}
                    className="object-cover object-top"
                  />
                  <AvatarFallback
                    className={cn(
                      'text-[10px] font-bold',
                      `bg-f1-${getTeamColorClass(getDriverDetails(driver)?.team)}`
                    )}
                  >
                    {driver}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-black font-mono text-sm uppercase leading-none">
                    {getDriverDetails(driver)?.fullName}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase font-mono leading-none mt-0.5">
                    {getDriverDetails(driver)?.team}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Select Driver</span>
            )}
          </SelectTrigger>
          <SelectContent className="bg-black border border-white/20 text-white max-h-[300px]">
            <SelectGroup>
              <SelectLabel className="text-xs text-gray-500 uppercase">Drivers</SelectLabel>
              {raceResults?.map((d) => (
                <SelectItem
                  key={d.driverCode}
                  value={d.driverCode}
                  className="text-xs font-mono focus:bg-gray-800 focus:text-white pl-2 py-2"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="w-6 h-6 border border-white/10">
                      <AvatarImage
                        src={getDriverImage(d.driverCode, year)}
                        className="object-cover object-top"
                      />
                      <AvatarFallback
                        className={cn(
                          'text-[10px] font-bold',
                          `bg-f1-${getTeamColorClass(d.team)}`
                        )}
                      >
                        {d.driverCode}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-bold uppercase">{d.fullName}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Telemetry Type Selector */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar px-1">
        {['speed', 'throttle', 'brake', 'rpm', 'drs', 'gear'].map((t) => (
          <button
            key={t}
            onClick={() => setTelemetryType(t as TelemetryType)}
            className={cn(
              'px-4 py-2 text-xs font-black uppercase tracking-wider border whitespace-nowrap transition-all',
              telemetryType === t
                ? 'bg-white text-black border-white'
                : 'bg-black text-gray-500 border-white/20 hover:border-white/50'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-zinc-900/30 border border-white/10 p-2 mb-6 relative min-h-[350px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
            <LoadingSpinnerF1 />
          </div>
        )}

        {!isLoading &&
          (telemetryType === 'gear' ? (
            // Gear Map Visualization
            telemetryData ? (
              <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-black/40 rounded-lg">
                {/* Controls */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-20 pointer-events-none">
                  <div className="bg-black/80 p-2 border border-white/10 rounded backdrop-blur-sm pointer-events-auto">
                    <div className="flex flex-col gap-1">
                      {gearColors.map((c, i) => {
                        const gear = i + 1;
                        const isHovered = hoveredGear === gear;
                        return (
                          <div
                            key={gear}
                            className={cn(
                              'flex items-center gap-2 transition-opacity duration-200',
                              hoveredGear !== null && !isHovered ? 'opacity-30' : 'opacity-100'
                            )}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: c }}
                            ></div>
                            <span className="text-[9px] font-mono text-gray-300">G{gear}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rotate Button */}
                <button
                  onClick={() => setIsRotated(!isRotated)}
                  className="absolute top-2 left-2 z-20 bg-black/80 border border-white/20 text-white text-[10px] uppercase font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Rotate
                </button>

                <svg
                  viewBox="0 0 1000 500"
                  className={cn(
                    'w-full h-full transition-transform duration-500',
                    isRotated ? 'rotate-90 scale-[2.5]' : 'scale-100'
                  )}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g transform={isRotated ? 'scale(1,-1) translate(0,-500)' : ''}>
                    <path
                      d={(telemetryData as GearShiftMapData).circuitLayout}
                      fill="none"
                      stroke="#1f2937"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {(telemetryData as GearShiftMapData).segments.map((segment, index) => (
                      <path
                        key={index}
                        d={segment.path}
                        fill="none"
                        stroke={getGearColor(segment.gear)}
                        strokeWidth={hoveredGear === segment.gear ? '20' : '12'}
                        strokeLinecap="butt"
                        strokeLinejoin="round"
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          opacity: hoveredGear !== null && hoveredGear !== segment.gear ? 0.3 : 1,
                        }}
                        onClick={() =>
                          setHoveredGear(segment.gear === hoveredGear ? null : segment.gear)
                        }
                      />
                    ))}
                  </g>
                </svg>
                {hoveredGear && (
                  <div className="absolute bottom-4 left-4 z-20 bg-black/90 border border-white/20 p-2 backdrop-blur text-xs font-mono text-white pointer-events-none">
                    Gear:{' '}
                    <span
                      style={{ color: getGearColor(hoveredGear) }}
                      className="font-bold text-lg ml-1"
                    >
                      {hoveredGear}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-gray-500 font-mono uppercase text-xs">
                No Gear Data
              </div>
            )
          ) : // Standard Line Chart
          chartData.length > 0 ? (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis
                    dataKey="Distance"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}km`}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={config.domain as [string | number, string | number]}
                    tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                    width={40}
                  />
                  <Tooltip
                    content={<TelemetryChartTooltip unit={config.unit} />}
                    cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={driver}
                    stroke={dColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: dColor, strokeWidth: 0 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500 font-mono uppercase text-xs">
              No Data Available
            </div>
          ))}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="bg-black border border-white/10 p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: dColor }} />
          <div className="flex items-center justify-between mb-2 pl-2">
            <span className="text-xs font-black uppercase italic text-white">{driver}</span>
            <span className="text-[9px] text-gray-500 uppercase font-bold">{config.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pl-2">
            <div>
              <div className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">
                {telemetryType === 'gear' ? 'Most Used' : 'Max'}
              </div>
              <div
                className="text-lg font-mono font-bold text-white leading-none"
                style={telemetryType === 'gear' ? { color: getGearColor(stats.max) } : {}}
              >
                {Math.round(stats.max)}
                <span className="text-[10px] text-gray-500 ml-0.5">{config.unit}</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">Avg</div>
              <div className="text-lg font-mono font-bold text-white leading-none">
                {telemetryType === 'gear' ? stats.avg.toFixed(1) : Math.round(stats.avg)}
                <span className="text-[10px] text-gray-500 ml-0.5">{config.unit}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTelemetry;
export { MobileTelemetry };
