import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from '@/lib/recharts-lazy';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTeammateComparison } from '@/hooks/useCareerAnalytics';
import type { TeammateComparisonProps, TeammateSeasonData } from '@/lib/types/career-analytics';

interface TeammateGroup {
  teammateName: string;
  teammateCode: string;
  seasons: TeammateSeasonData[];
}

function groupByTeammate(data: TeammateSeasonData[]): TeammateGroup[] {
  const groups: Map<string, TeammateGroup> = new Map();
  for (const entry of data) {
    const key = entry.teammate.code;
    if (!groups.has(key)) {
      groups.set(key, {
        teammateName: entry.teammate.name,
        teammateCode: entry.teammate.code,
        seasons: [],
      });
    }
    groups.get(key)!.seasons.push(entry);
  }
  return Array.from(groups.values());
}

interface SeasonBarData {
  label: string;
  driverQual: number;
  teammateQual: number;
  driverRace: number;
  teammateRace: number;
  pointsDiff: number;
  season: number;
}

function TeammateGroupSection({ group }: { group: TeammateGroup }) {
  const chartData: SeasonBarData[] = useMemo(() => {
    return group.seasons
      .sort((a, b) => a.season - b.season)
      .map((s) => ({
        label: s.raceRange ? `${s.season} (${s.raceRange})` : `${s.season}`,
        driverQual: s.qualifying.driver,
        teammateQual: s.qualifying.teammate,
        driverRace: s.races.driver,
        teammateRace: s.races.teammate,
        pointsDiff: s.pointsDiff,
        season: s.season,
      }));
  }, [group.seasons]);

  const chartHeight = Math.max(200, chartData.length * 60 + 60);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[15px] font-semibold text-white">vs {group.teammateName}</h3>
        <span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
          {group.teammateCode}
        </span>
      </div>

      {/* Qualifying H2H */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Qualifying Head-to-Head
          </p>
        </div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ height: chartHeight, minWidth: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={90}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as SeasonBarData;
                    return (
                      <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                        <p className="mb-1 text-[11px] font-bold text-white">{d.label}</p>
                        <p className="text-[11px] text-emerald-400">Driver: {d.driverQual}</p>
                        <p className="text-[11px] text-red-400">
                          {group.teammateCode}: {d.teammateQual}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="driverQual"
                  name="Driver"
                  fill="#34d399"
                  radius={[0, 3, 3, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="teammateQual"
                  name={group.teammateCode}
                  fill="#f87171"
                  radius={[0, 3, 3, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Race H2H */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Race Finish Head-to-Head
          </p>
        </div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ height: chartHeight, minWidth: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={90}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as SeasonBarData;
                    return (
                      <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                        <p className="mb-1 text-[11px] font-bold text-white">{d.label}</p>
                        <p className="text-[11px] text-emerald-400">Driver: {d.driverRace}</p>
                        <p className="text-[11px] text-red-400">
                          {group.teammateCode}: {d.teammateRace}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="driverRace"
                  name="Driver"
                  fill="#34d399"
                  radius={[0, 3, 3, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="teammateRace"
                  name={group.teammateCode}
                  fill="#f87171"
                  radius={[0, 3, 3, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Points Differential */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
            Points Differential
          </p>
        </div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ height: chartHeight, minWidth: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={90}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as SeasonBarData;
                    return (
                      <div className="rounded-xl border border-white/[0.06] bg-[#09090b]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
                        <p className="mb-1 text-[11px] font-bold text-white">{d.label}</p>
                        <p
                          className={`text-[11px] font-mono font-bold ${d.pointsDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {d.pointsDiff >= 0 ? '+' : ''}
                          {d.pointsDiff} pts
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pointsDiff" name="Points Diff" radius={[0, 3, 3, 0]} barSize={18}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pointsDiff >= 0 ? '#34d399' : '#f87171'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TeammateComparison({ slug }: TeammateComparisonProps) {
  const { data, isLoading, isError, refetch } = useTeammateComparison(slug);

  const groups = useMemo(() => {
    if (!data || data.length === 0) return [];
    return groupByTeammate(data);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-[300px] animate-pulse rounded-xl border border-white/[0.06] bg-[#0c0c0e]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.07]">
          <span className="text-sm text-red-400">!</span>
        </div>
        <p className="text-[14px] text-white/40">Failed to load teammate comparison data.</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-8">
        <p className="text-[14px] text-white/40">No teammate comparison data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Legend */}
      <section>
        <SectionHeader title="Teammate Battles" />
        <div className="flex items-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-sm bg-emerald-400" />
            <span className="text-white/40">Driver ahead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-sm bg-red-400" />
            <span className="text-white/40">Teammate ahead</span>
          </div>
        </div>
      </section>

      {groups.map((group) => (
        <TeammateGroupSection key={group.teammateCode} group={group} />
      ))}
    </div>
  );
}
