import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Bar,
} from '@/lib/recharts-lazy';
import { Cell } from '@/lib/recharts-cell';
import {
  fetchLapTimes,
  fetchSessionDrivers,
  fetchLapPositions,
  fetchSpecificRaceResults,
  fetchSessionIncidents,
  fetchTelemetrySpeed,
  fetchTelemetryThrottle,
  fetchTelemetryBrake,
  fetchTelemetryRPM,
  fetchTelemetryDRS,
  fetchTireStrategy,
  fetchDriverChampionshipProgression,
  fetchTeamChampionshipProgression,
  fetchChampionshipProgression,
  fetchPaceDistribution,
  fetchLapGaps,
  fetchSectorComparison,
  fetchDriverLapNumbers,
  type LapTimeDataPoint,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { groupDriversByTeam, getLineStylesForDriver } from '@/lib/teamUtils';

interface SavedChartRendererProps {
  chartType: string;
  chartConfig: Record<string, unknown>;
}

const TIRE_COLORS: Record<string, string> = {
  SOFT: '#ef4444',
  MEDIUM: '#facc15',
  HARD: '#ffffff',
  INTERMEDIATE: '#10b981',
  WET: '#3b82f6',
};

const TELEMETRY_CHART_TYPES = ['speed_trace', 'throttle', 'brake', 'rpm', 'gear_map', 'drs'];

function resolveTelemetryField(chartType: string): string {
  const map: Record<string, string> = {
    speed_trace: 'Speed',
    throttle: 'Throttle',
    brake: 'Brake',
    rpm: 'RPM',
    drs: 'DRS',
  };
  return map[chartType] || 'Speed';
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

function formatGap(gap: number | null): string {
  if (gap === null || isNaN(gap)) return 'N/A';
  return gap > 0 ? `+${gap.toFixed(3)}` : gap.toFixed(3);
}

export function buildChartUrl(chartType: string, chartConfig: Record<string, unknown>): string {
  const year = chartConfig.year as number;
  const event = chartConfig.event as string;
  const session = chartConfig.session as string;
  const driverSlug = chartConfig.driverSlug as string;
  const teamSlug = chartConfig.teamSlug as string;

  if (chartType === 'driver_championship' && driverSlug) {
    return `/driver/${driverSlug}`;
  }
  if (chartType === 'team_championship' && teamSlug) {
    return `/team/${teamSlug}`;
  }
  if (chartType === 'championship_progression') {
    return `/championship`;
  }
  if (['peak_vs_consistent', 'pace_evolution', 'pace_gap'].includes(chartType)) {
    const params = new URLSearchParams({ year: String(year), event: event || '' });
    return `/team-pace?${params.toString()}`;
  }
  if (!year || !event) return '#';

  const raceId = `${year}-${event.toLowerCase().replace(/\s+/g, '-')}`;
  const sessParam = session ? `?session=${session}` : '';

  if (TELEMETRY_CHART_TYPES.includes(chartType)) {
    return `/race/${raceId}/telemetry${sessParam}`;
  }
  if (['lap_times', 'pace_analysis', 'gap_to_leader'].includes(chartType)) {
    return `/race/${raceId}/lap-analysis${sessParam}`;
  }
  if (chartType === 'position_changes') {
    return `/race/${raceId}/lap-analysis${sessParam}`;
  }
  if (chartType === 'circuit_comparison' || chartType.startsWith('comparison_')) {
    return `/race/${raceId}/head-to-head${sessParam}`;
  }
  if (chartType === 'tire_strategy') {
    return `/race/${raceId}/strategy${sessParam}`;
  }
  return `/race/${raceId}/overview${sessParam}`;
}

function TelemetryMiniChart({
  data,
  chartType,
}: {
  data: Array<Record<string, number>>;
  chartType: string;
}) {
  if (!data || data.length === 0) return null;
  const field = resolveTelemetryField(chartType);
  const dataKey = chartType === 'drs' ? 'DRS' : field;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="#ef4444"
          strokeWidth={1}
          dot={false}
          isAnimationActive={false}
        />
        <XAxis dataKey="Distance" hide />
        <YAxis hide domain={['auto', 'auto']} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function LapTimesMiniChart({ data, drivers }: { data: LapTimeDataPoint[]; drivers: string[] }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="LapNumber" hide />
        <YAxis hide domain={['auto', 'auto']} />
        {drivers.map((code) => (
          <Line
            key={code}
            type="monotone"
            dataKey={code}
            stroke={driverColor(code, new Date().getFullYear())}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PositionsMiniChart({
  data,
  drivers,
}: {
  data: Array<Record<string, number>>;
  drivers: string[];
}) {
  if (!data || data.length === 0) return null;

  const teamGroups = groupDriversByTeam(drivers, new Date().getFullYear());

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="LapNumber" hide />
        <YAxis hide reversed domain={[1, 'dataMax + 1']} />
        {drivers.map((code) => {
          const color = driverColor(code, new Date().getFullYear());
          return (
            <Line
              key={code}
              type="monotone"
              dataKey={code}
              stroke={color}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PaceMiniChart({
  data,
}: {
  data: Array<{
    median: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    driverCode: string;
  }>;
}) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    iqr: [d.q1, d.q3] as [number, number],
  }));

  const minPace = Math.min(...chartData.map((d) => d.min));
  const maxPace = Math.max(...chartData.map((d) => d.max));
  const pad = (maxPace - minPace) * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="driverCode" hide />
        <YAxis hide domain={[minPace - pad, maxPace + pad]} />
        <Bar dataKey="iqr" barSize={8} radius={[2, 2, 2, 2]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.driverCode}
              fill={driverColor(entry.driverCode, new Date().getFullYear())}
              opacity={0.4}
            />
          ))}
        </Bar>
        <Scatter name="Median" dataKey="median" fill="#fff" shape="square" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function GapMiniChart({ data, drivers }: { data: LapTimeDataPoint[]; drivers: string[] }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="LapNumber" hide />
        <YAxis hide domain={['auto', 'auto']} />
        {drivers.map((code) => (
          <Line
            key={code}
            type="monotone"
            dataKey={code}
            stroke={driverColor(code, new Date().getFullYear())}
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function TireMiniChart({
  data,
}: {
  data: Array<{
    driver: string;
    stints: Array<{ compound: string; startLap: number; endLap: number }>;
  }>;
}) {
  if (!data || data.length === 0) return null;

  const maxLaps = Math.max(...data.flatMap((d) => d.stints.map((s) => s.endLap)), 1);
  const barHeight = Math.max(6, Math.min(12, 200 / data.length));

  return (
    <div className="flex h-full flex-col gap-px px-2 py-1">
      {data.map((driver) => (
        <div key={driver.driver} className="flex items-center gap-1">
          <span className="w-[18px] shrink-0 text-[8px] font-medium text-white/50">
            {driver.driver}
          </span>
          <div className="relative flex-1" style={{ height: barHeight }}>
            {driver.stints.map((stint, i) => (
              <div
                key={i}
                className="absolute top-0 rounded-sm"
                style={{
                  left: `${(stint.startLap / maxLaps) * 100}%`,
                  width: `${Math.max(2, ((stint.endLap - stint.startLap) / maxLaps) * 100)}%`,
                  height: '100%',
                  backgroundColor: TIRE_COLORS[stint.compound?.toUpperCase()] || '#666',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChampionshipMiniChart({
  data,
  driverCode,
}: {
  data: Array<Record<string, string | number>>;
  driverCode: string;
}) {
  if (!data || data.length === 0) return null;

  const drivers = Object.keys(data[0] || {}).filter(
    (k) => k !== 'name' && k !== 'uniqueId' && k !== 'shortName' && k !== 'country' && k !== 'round'
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="none" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="shortName" hide />
        <YAxis hide domain={['auto', 'auto']} />
        {drivers.map((code) => (
          <Line
            key={code}
            type="monotone"
            dataKey={code}
            stroke={driverColor(code, new Date().getFullYear())}
            strokeWidth={code === driverCode ? 1.5 : 0.5}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function CircuitMiniChart({
  d1,
  d2,
  color1,
  color2,
}: {
  d1: string;
  d2: string;
  color1: string;
  color2: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 text-[10px] text-white/60">
      <span style={{ color: color1 }}>{d1}</span>
      <span className="text-white/20">vs</span>
      <span style={{ color: color2 }}>{d2}</span>
    </div>
  );
}

export function SavedChartRenderer({ chartType, chartConfig }: SavedChartRendererProps) {
  const year = chartConfig.year as number;
  const event = chartConfig.event as string;
  const session = chartConfig.session as string;
  const drivers = (chartConfig.drivers as string[]) || [];
  const driver = chartConfig.driver as string;
  const lap = chartConfig.lap as string | number;
  const driver1 = chartConfig.driver1 as string;
  const driver2 = chartConfig.driver2 as string;
  const lap1 = (chartConfig.lap1 as string | number) || 'fastest';
  const lap2 = (chartConfig.lap2 as string | number) || 'fastest';
  const driverSlug = chartConfig.driverSlug as string;
  const teamSlug = chartConfig.teamSlug as string;
  const selectedSeason = chartConfig.season as number;

  const enabled = !!year || !!driverSlug || !!teamSlug || !!selectedSeason;

  if (!enabled) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[10px] text-white/20">No data</span>
      </div>
    );
  }

  return (
    <div className="size-full overflow-hidden scale-[0.85] origin-center pointer-events-none">
      <ChartContent chartType={chartType} chartConfig={chartConfig} />
    </div>
  );
}

function ChartContent({ chartType, chartConfig }: SavedChartRendererProps) {
  const year = chartConfig.year as number;
  const event = chartConfig.event as string;
  const session = chartConfig.session as string;
  const drivers = (chartConfig.drivers as string[]) || [];
  const driver = chartConfig.driver as string;
  const lap = (chartConfig.lap as string | number) || 'fastest';
  const driver1 = chartConfig.driver1 as string;
  const driver2 = chartConfig.driver2 as string;
  const lap1 = (chartConfig.lap1 as string | number) || 'fastest';
  const lap2 = (chartConfig.lap2 as string | number) || 'fastest';
  const driverSlug = chartConfig.driverSlug as string;
  const teamSlug = chartConfig.teamSlug as string;
  const selectedSeason = chartConfig.season as number;

  const { data: telemetryData } = useQuery({
    queryKey: ['savedThumbnail', 'telemetry', chartType, year, event, session, driver, lap],
    queryFn: async () => {
      const field = resolveTelemetryField(chartType);
      switch (field) {
        case 'Throttle':
          return fetchTelemetryThrottle(year, event, session, driver, lap);
        case 'Brake':
          return fetchTelemetryBrake(year, event, session, driver, lap);
        case 'RPM':
          return fetchTelemetryRPM(year, event, session, driver, lap);
        case 'DRS':
          return fetchTelemetryDRS(year, event, session, driver, lap);
        default:
          return fetchTelemetrySpeed(year, event, session, driver, lap);
      }
    },
    enabled:
      TELEMETRY_CHART_TYPES.includes(chartType) && !!year && !!event && !!session && !!driver,
    staleTime: 1000 * 60 * 30,
  });

  const { data: lapTimesData } = useQuery({
    queryKey: ['savedThumbnail', 'lapTimes', year, event, session, ...drivers.sort()],
    queryFn: () => fetchLapTimes(year, event, session, drivers),
    enabled:
      (chartType === 'lap_times' || chartType === 'gap_to_leader') &&
      !!year &&
      !!event &&
      !!session &&
      drivers.length >= 2,
    staleTime: 1000 * 60 * 30,
  });

  const { data: paceData } = useQuery({
    queryKey: ['savedThumbnail', 'paceDistribution', year, event, session, ...drivers.sort()],
    queryFn: async () => {
      const result = await fetchPaceDistribution(year, event, session, drivers);
      return Array.isArray(result) ? result : (result.overall ?? []);
    },
    enabled: chartType === 'pace_analysis' && !!year && !!event && !!session && drivers.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  const { data: positionsData } = useQuery({
    queryKey: ['savedThumbnail', 'lapPositions', year, event, session],
    queryFn: () => fetchLapPositions(year, event, session),
    enabled: chartType === 'position_changes' && !!year && !!session,
    staleTime: 1000 * 60 * 30,
  });

  const { data: gapData } = useQuery({
    queryKey: ['savedThumbnail', 'lapGaps', year, event, session, ...drivers.sort()],
    queryFn: () => fetchLapGaps(year, event, session, drivers),
    enabled: chartType === 'gap_to_leader' && !!year && !!event && !!session && drivers.length >= 2,
    staleTime: 1000 * 60 * 30,
  });

  const { data: tireData } = useQuery({
    queryKey: ['savedThumbnail', 'tireStrategy', year, event, session],
    queryFn: () => fetchTireStrategy(year, event, session),
    enabled: chartType === 'tire_strategy' && !!year && !!event && !!session,
    staleTime: 1000 * 60 * 30,
    select: (raw) => (Array.isArray(raw) ? raw : ((raw as { stints: unknown[] }).stints ?? [])),
  });

  const { data: driverChampData } = useQuery({
    queryKey: ['savedThumbnail', 'driverChampionship', driverSlug, selectedSeason],
    queryFn: () => fetchDriverChampionshipProgression(driverSlug, selectedSeason),
    enabled: chartType === 'driver_championship' && !!driverSlug && !!selectedSeason,
    staleTime: 1000 * 60 * 30,
  });

  const { data: teamChampData } = useQuery({
    queryKey: ['savedThumbnail', 'teamChampionship', teamSlug, selectedSeason],
    queryFn: () => fetchTeamChampionshipProgression(teamSlug, selectedSeason),
    enabled: chartType === 'team_championship' && !!teamSlug && !!selectedSeason,
    staleTime: 1000 * 60 * 30,
  });

  const { data: champProgData } = useQuery({
    queryKey: ['savedThumbnail', 'championshipProgression', year],
    queryFn: () => fetchChampionshipProgression(year),
    enabled: chartType === 'championship_progression' && !!year,
    staleTime: 1000 * 60 * 30,
  });

  if (TELEMETRY_CHART_TYPES.includes(chartType)) {
    if (!telemetryData) return <LoadingPlaceholder />;
    const trace = Array.isArray(telemetryData)
      ? telemetryData
      : ((telemetryData as { trace: unknown[] }).trace ?? []);
    if (!Array.isArray(trace) || trace.length === 0) return <LoadingPlaceholder />;
    return (
      <TelemetryMiniChart data={trace as Array<Record<string, number>>} chartType={chartType} />
    );
  }

  if (chartType === 'lap_times') {
    if (!lapTimesData?.lapComparison) return <LoadingPlaceholder />;
    return <LapTimesMiniChart data={lapTimesData.lapComparison} drivers={drivers} />;
  }

  if (chartType === 'pace_analysis') {
    if (!paceData || paceData.length === 0) return <LoadingPlaceholder />;
    return <PaceMiniChart data={paceData} />;
  }

  if (chartType === 'gap_to_leader') {
    const gd = gapData?.lapGaps || lapTimesData?.lapComparison;
    if (!gd || gd.length === 0) return <LoadingPlaceholder />;
    return <GapMiniChart data={gd} drivers={drivers} />;
  }

  if (chartType === 'position_changes') {
    if (!positionsData || positionsData.length === 0) return <LoadingPlaceholder />;
    const allDrivers =
      drivers.length > 0
        ? drivers
        : Object.keys(positionsData[0] || {}).filter((k) => k !== 'LapNumber');
    return <PositionsMiniChart data={positionsData} drivers={allDrivers} />;
  }

  if (chartType === 'circuit_comparison' || chartType.startsWith('comparison_')) {
    if (!driver1 || !driver2) return <LoadingPlaceholder />;
    const c1 = driverColor(driver1, year || new Date().getFullYear());
    const c2 = driverColor(driver2, year || new Date().getFullYear());
    return <CircuitMiniChart d1={driver1} d2={driver2} color1={c1} color2={c2} />;
  }

  if (chartType === 'tire_strategy') {
    if (!tireData || tireData.length === 0) return <LoadingPlaceholder />;
    return (
      <TireMiniChart
        data={
          tireData as Array<{
            driver: string;
            stints: Array<{ compound: string; startLap: number; endLap: number }>;
          }>
        }
      />
    );
  }

  if (chartType === 'driver_championship') {
    if (!driverChampData) return <LoadingPlaceholder />;
    const chartData = buildChampChartData(driverChampData, driverSlug);
    return <ChampionshipMiniChart data={chartData} driverCode={driverSlug} />;
  }

  if (chartType === 'team_championship') {
    if (!teamChampData) return <LoadingPlaceholder />;
    const chartData = buildChampChartData(teamChampData, teamSlug);
    return <ChampionshipMiniChart data={chartData} driverCode={teamSlug} />;
  }

  if (chartType === 'championship_progression') {
    if (!champProgData) return <LoadingPlaceholder />;
    const chartData = buildFullChampChartData(champProgData);
    return <ChampionshipMiniChart data={chartData} driverCode={drivers[0] || ''} />;
  }

  return (
    <div className="flex h-full items-center justify-center text-[10px] text-white/30">
      {chartType.replace(/_/g, ' ')}
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="size-3 animate-spin rounded-full border border-white/[0.06] border-t-white/30" />
    </div>
  );
}

function buildChampChartData(
  data: {
    rounds: Array<{ event: string; round: number; country?: string }>;
    drivers?: Record<string, { points_history: number[]; name: string }>;
    rivals?: Array<{ code: string; name: string; points_history: number[] }>;
  },
  targetCode: string
): Array<Record<string, string | number>> {
  if (!data?.rounds) return [];

  const allDrivers: Record<string, { points_history: number[]; name: string }> = {
    ...(data.rivals?.reduce(
      (acc, r) => ({ ...acc, [r.code]: { points_history: r.points_history, name: r.name } }),
      {}
    ) || {}),
    ...(data.drivers || {}),
  };

  return data.rounds.map((round, idx) => {
    const point: Record<string, string | number> = {
      name: round.event,
      shortName: round.country || `R${round.round}`,
    };
    Object.entries(allDrivers).forEach(([code, driverData]) => {
      if (driverData.points_history[idx] !== undefined) {
        point[code] = driverData.points_history[idx];
      }
    });
    return point;
  });
}

function buildFullChampChartData(data: {
  rounds: Array<{ event: string; round: number; country?: string }>;
  drivers: Record<string, { points_history: number[]; name: string }>;
}): Array<Record<string, string | number>> {
  if (!data?.rounds) return [];

  return data.rounds.map((round, idx) => {
    const point: Record<string, string | number> = {
      name: round.event,
      shortName: round.country || `R${round.round}`,
    };
    Object.entries(data.drivers || {}).forEach(([code, driverData]) => {
      if (driverData.points_history[idx] !== undefined) {
        point[code] = driverData.points_history[idx];
      }
    });
    return point;
  });
}

export default SavedChartRenderer;
