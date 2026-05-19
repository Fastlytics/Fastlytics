import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/lib/recharts-lazy';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchDriverChampionshipProgression,
  ChampionshipProgressionResponse,
  DriverCareer,
} from '@/lib/api';
import { driverColor } from '@/lib/driverColor';
import { cn } from '@/lib/utils';
import { CARD_CONTAINER, CARD_LABEL } from '@/lib/card-styles';

interface DriverChampionshipSectionProps {
  career: DriverCareer;
  slug: string;
}

export function DriverChampionshipSection({ career, slug }: DriverChampionshipSectionProps) {
  // Default to the most recent season the driver competed in
  const availableSeasons = useMemo(() => career.seasons.map((s) => s.season), [career.seasons]);
  const [selectedSeason, setSelectedSeason] = useState<number>(availableSeasons[0] || 2024);

  const {
    data: progression,
    isLoading,
    isError,
    error,
  } = useQuery<ChampionshipProgressionResponse>({
    queryKey: ['driverChampionship', slug, selectedSeason],
    queryFn: () => fetchDriverChampionshipProgression(slug, selectedSeason),
    enabled: !!slug && !!selectedSeason,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className={CARD_CONTAINER}>
        {/* Header */}
        <div className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={CARD_LABEL}>Championship Progression</h3>
            <p className="mt-0.5 text-[12px] text-white/40">
              Cumulative points across the season compared to title rivals
            </p>
          </div>

          {/* Season selector */}
          <Select
            value={selectedSeason.toString()}
            onValueChange={(value) => setSelectedSeason(parseInt(value, 10))}
          >
            <SelectTrigger className="h-9 w-[120px] rounded-md border border-white/[0.06] bg-transparent text-[13px] font-medium text-white focus:ring-0 focus:border-white/[0.12]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-white shadow-xl">
              <SelectGroup>
                {availableSeasons.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-[13px] font-medium focus:bg-white/[0.04] focus:text-white"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Chart content */}
        <div className="border-t border-white/[0.04] p-5">
          {isLoading && (
            <div className="flex h-[350px] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-5 animate-spin rounded-full border-2 border-white/[0.06] border-t-white/60" />
                <span className="text-[12px] text-white/40">Loading championship data</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex h-[350px] w-full flex-col items-center justify-center">
              <p className="text-[14px] font-medium text-red-400">Data unavailable</p>
              <p className="mt-1 text-[12px] text-white/40">
                {(error as Error)?.message || 'Could not load championship progression.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && progression && (
            <ChampionshipChart
              progression={progression}
              driverCode={career.code}
              season={selectedSeason}
            />
          )}
        </div>
      </div>
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// Chart sub-component
// ---------------------------------------------------------------------------

function ChampionshipChart({
  progression,
  driverCode,
  season,
}: {
  progression: ChampionshipProgressionResponse;
  driverCode: string;
  season: number;
}) {
  // Build chart data: one entry per round, with points for each driver
  const chartData = useMemo(() => {
    const maxRounds = Math.max(
      progression.rounds.length,
      ...progression.rivals.map((r) => r.rounds.length)
    );

    const data: Array<Record<string, number | string>> = [];

    for (let i = 0; i < maxRounds; i++) {
      const targetRound = progression.rounds[i];
      const point: Record<string, number | string> = {
        round: targetRound?.round ?? i + 1,
        event: targetRound?.event ?? `Round ${i + 1}`,
        [driverCode]: targetRound?.points ?? 0,
      };

      for (const rival of progression.rivals) {
        const rRound = rival.rounds[i];
        point[rival.code] = rRound?.points ?? 0;
      }

      data.push(point);
    }

    return data;
  }, [progression, driverCode]);

  const mainColor = driverColor(driverCode, season);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-[13px] text-white/40">
        No championship data available for this season
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="none" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="round"
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
            }}
            tickFormatter={(value: number) => `R${value}`}
          />
          <YAxis
            stroke="rgba(255,255,255,0.06)"
            tick={{
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 500,
            }}
            width={45}
            tickFormatter={(value: number) => `${value}`}
          />
          <Tooltip content={<ChampionshipTooltip driverCode={driverCode} />} />

          {/* Rival lines — muted grey, pushed to background */}
          {progression.rivals.map((rival) => (
            <Line
              key={rival.code}
              type="monotone"
              dataKey={rival.code}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
              dot={false}
              activeDot={{
                r: 3,
                strokeWidth: 1,
                stroke: 'rgba(255,255,255,0.4)',
                fill: 'rgba(255,255,255,0.15)',
              }}
              connectNulls
            />
          ))}

          {/* Target driver line — prominent */}
          <Line
            type="monotone"
            dataKey={driverCode}
            stroke={mainColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: mainColor }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 border-t border-white/[0.04] pt-4 sm:grid-cols-4">
        <StatCell
          label="Final Position"
          value={`P${progression.finalPosition}`}
          accent={progression.finalPosition === 1}
        />
        <StatCell label="Total Points" value={progression.finalPoints} />
        <StatCell
          label="Wins"
          value={
            progression.rounds.length > 0
              ? progression.rounds[progression.rounds.length - 1].wins
              : 0
          }
          accent={(progression.rounds[progression.rounds.length - 1]?.wins ?? 0) > 0}
        />
        <StatCell
          label="Gap to P1"
          value={
            progression.finalPosition === 1
              ? '—'
              : progression.rivals.length > 0
                ? `${(progression.rivals[0].finalPoints - progression.finalPoints).toFixed(1)} pts`
                : '—'
          }
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ backgroundColor: mainColor }}
          />
          <span className="text-[11px] font-medium text-white">{driverCode}</span>
        </div>
        {progression.rivals.map((rival) => (
          <div key={rival.code} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-white/20" />
            <span className="text-[11px] text-white/40">{rival.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  stroke: string;
  payload: {
    event?: string;
    [key: string]: unknown;
  };
}

interface ChampionshipTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  driverCode: string;
}

function ChampionshipTooltip({ active, payload, label, driverCode }: ChampionshipTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const eventName = payload[0]?.payload?.event || `Round ${label}`;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0c] p-3 shadow-2xl">
      <div className="mb-2 border-b border-white/[0.06] pb-2">
        <span className="text-[11px] font-medium text-white/60">Round {label}</span>
        <p className="text-[12px] font-medium text-white">{eventName}</p>
      </div>
      <div className="space-y-1">
        {payload
          .sort((a: TooltipPayloadEntry, b: TooltipPayloadEntry) => (b.value ?? 0) - (a.value ?? 0))
          .map((entry: TooltipPayloadEntry) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: entry.stroke }}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    entry.dataKey === driverCode ? 'text-white' : 'text-white/50'
                  )}
                >
                  {entry.dataKey}
                </span>
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-white">
                {entry.value} pts
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cell
// ---------------------------------------------------------------------------

function StatCell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/[0.04] p-3">
      <span className="text-[11px] font-medium text-white/40">{label}</span>
      <span
        className={cn(
          'text-[18px] font-semibold tabular-nums tracking-tight',
          accent ? 'text-white' : 'text-white/90'
        )}
      >
        {value}
      </span>
    </div>
  );
}
