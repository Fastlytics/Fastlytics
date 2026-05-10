// knip-ignore
import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from '@/lib/recharts-lazy';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTeamPaceSession,
  CompoundPace,
  DriverPace,
  SectorPace,
  TeamPaceSession,
} from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';
import { useChartExport } from '@/hooks/useChartExport';
import ChartExportMenu from '@/components/charts/ChartExportMenu';

interface TeamPaceBreakdownProps {
  year: number;
  event: string;
  session: string;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC107',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#4CAF50',
  WET: '#2196F3',
};

const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#4781D7',
  Ferrari: '#F91536',
  Mercedes: '#6CD3BF',
  McLaren: '#F58020',
  'Aston Martin': '#229971',
  Alpine: '#0093CC',
  Williams: '#64C4FF',
  Haas: '#B6BABD',
  Sauber: '#52E252',
  'Kick Sauber': '#52E252',
  'Racing Bulls': '#6692FF',
  RB: '#6692FF',
  AlphaTauri: '#5E8FAA',
  'Alfa Romeo': '#C92D4B',
};

const getTeamColor = (team: string): string => TEAM_COLORS[team] || '#666666';

const formatLapTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toFixed(3).padStart(6, '0')}` : secs.toFixed(3);
};

type ViewMode = 'compound' | 'sector' | 'drivers';

export const TeamPaceBreakdown: React.FC<TeamPaceBreakdownProps> = ({ year, event, session }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('compound');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

  // Single query — backend handles all computation and caching
  const {
    data: paceData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['teamPaceSession', year, event, session],
    queryFn: () => fetchTeamPaceSession(year, event, session),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // ──────────────────────────────────────────
  // COMPOUND PACE DATA (from backend)
  // ──────────────────────────────────────────
  const compoundData = useMemo(() => {
    if (!paceData?.compoundPace)
      return { compounds: [] as string[], teamData: [] as (CompoundPace & { color: string })[] };
    const compounds = [...new Set(paceData.compoundPace.map((d) => d.compound))].toSorted(
      (a, b) => {
        const order = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
        return order.indexOf(a) - order.indexOf(b);
      }
    );
    const teamData = paceData.compoundPace.map((d) => ({
      ...d,
      color: d.teamColor ? getTeamColor(d.teamName) : getTeamColor(d.teamName),
    }));
    return { compounds, teamData };
  }, [paceData]);

  // ──────────────────────────────────────────
  // SECTOR DOMINANCE DATA (from backend)
  // ──────────────────────────────────────────
  const sectorData = useMemo(() => {
    if (!paceData?.sectorPace) return [] as SectorPace[];
    return paceData.sectorPace.toSorted((a, b) => {
      const totalA = (a.sector1Median ?? 999) + (a.sector2Median ?? 999) + (a.sector3Median ?? 999);
      const totalB = (b.sector1Median ?? 999) + (b.sector2Median ?? 999) + (b.sector3Median ?? 999);
      return totalA - totalB;
    });
  }, [paceData]);

  // ──────────────────────────────────────────
  // DRIVER BREAKDOWN DATA (from backend)
  // ──────────────────────────────────────────
  const driversByTeam = useMemo(() => {
    if (!paceData?.driverPace) return {} as Record<string, DriverPace[]>;
    const grouped: Record<string, DriverPace[]> = {};
    paceData.driverPace.forEach((d) => {
      if (!grouped[d.teamName]) grouped[d.teamName] = [];
      grouped[d.teamName].push(d);
    });
    // Sort drivers within each team by median time
    Object.values(grouped).forEach((drivers) =>
      drivers.sort((a, b) => a.medianTime - b.medianTime)
    );
    return grouped;
  }, [paceData]);

  // Overall team ranking
  const teamRanking = useMemo(() => {
    if (!paceData?.teamPace) return [] as TeamPaceSession[];
    return paceData.teamPace.toSorted((a, b) => a.medianTime - b.medianTime);
  }, [paceData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinnerF1 />
      </div>
    );
  }
  if (isError || !paceData) return null;

  // Determine active compound or default to first
  const activeCompound = selectedCompound || compoundData.compounds[0] || 'MEDIUM';
  const compoundBars = compoundData.teamData
    .filter((d) => d.compound === activeCompound)
    .sort((a, b) => a.medianTime - b.medianTime);

  // Sector best values (for heatmap coloring)
  const bestS1 =
    sectorData.length > 0 ? Math.min(...sectorData.map((d) => d.sector1Median ?? 999)) : 0;
  const bestS2 =
    sectorData.length > 0 ? Math.min(...sectorData.map((d) => d.sector2Median ?? 999)) : 0;
  const bestS3 =
    sectorData.length > 0 ? Math.min(...sectorData.map((d) => d.sector3Median ?? 999)) : 0;

  const sectorHeatColor = (val: number, best: number): string => {
    const delta = val - best;
    if (delta < 0.05) return '#22c55e'; // green - fastest
    if (delta < 0.15) return '#86efac'; // light green
    if (delta < 0.3) return '#fbbf24'; // yellow
    if (delta < 0.5) return '#f97316'; // orange
    return '#ef4444'; // red - slowest
  };

  const refPace = compoundBars.length > 0 ? compoundBars[0].medianTime : 0;

  return (
    <div ref={exportRef} className="space-y-0">
      {/* Section Header */}
      <div className="mb-6">
        <p
          className="text-[12px] font-semibold uppercase tracking-wider text-white/80"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Team Pace
        </p>
        <p
          className="mt-0.5 text-[18px] font-bold uppercase italic text-white"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Pace Breakdown
        </p>
      </div>

      {/* View Mode Tabs */}
      <div
        className="flex overflow-hidden rounded-t-xl border border-white/[0.06] bg-[#0c0c0e]"
        data-export-ignore
      >
        {(
          [
            ['compound', 'Compound Pace'],
            ['sector', 'Sector Dominance'],
            ['drivers', 'Driver Breakdown'],
          ] as [ViewMode, string][]
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-3 text-[12px] font-semibold uppercase tracking-wider transition-all ${
              viewMode === mode
                ? 'rounded-lg bg-white/[0.08] text-white'
                : 'rounded-lg text-white hover:bg-white/[0.03] hover:text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
        {/* Export Button inside the tabs box */}
        <div className="flex items-center justify-center border-l border-white/[0.04] px-4">
          <ChartExportMenu
            onExport={(format) =>
              exportChart(format, {
                title: 'Team Pace Breakdown',
                subtitle:
                  viewMode === 'compound'
                    ? `${activeCompound} compound pace`
                    : viewMode === 'sector'
                      ? 'Sector dominance'
                      : 'Driver breakdown',
                year,
                event,
                session,
              })
            }
            isExporting={isExporting}
          />
        </div>
      </div>

      {/* ── COMPOUND PACE VIEW ── */}
      {viewMode === 'compound' && (
        <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
          {/* Compound Selector */}
          <div className="flex border-b border-white/[0.04]">
            {compoundData.compounds.map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedCompound(comp)}
                className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-all ${
                  activeCompound === comp
                    ? 'border-b-2 text-white'
                    : 'text-white hover:text-white/60'
                }`}
                style={
                  activeCompound === comp
                    ? { borderBottomColor: COMPOUND_COLORS[comp] || '#FFF' }
                    : undefined
                }
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: COMPOUND_COLORS[comp] || '#666' }}
                />
                {comp}
              </button>
            ))}
          </div>

          {/* Bar Chart: Team median pace on selected compound */}
          {compoundBars.length > 0 ? (
            <div className="px-4 py-3">
              <ResponsiveContainer width="100%" height={Math.max(200, compoundBars.length * 48)}>
                <BarChart
                  data={compoundBars.map((d) => ({
                    ...d,
                    gap: d.medianTime - refPace,
                    displayTime: formatLapTime(d.medianTime),
                    team: d.teamName,
                    color: getTeamColor(d.teamName),
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
                  barGap={3}
                >
                  <XAxis
                    type="number"
                    dataKey="gap"
                    domain={[0, 'dataMax + 0.1']}
                    tick={{
                      fill: '#FFF',
                      fontSize: 12,
                      fontWeight: 'bold',
                      fontFamily: "'Inter', sans-serif",
                    }}
                    stroke="#444"
                    tickFormatter={(v: number) => (v === 0 ? '0' : `+${v.toFixed(3)}`)}
                  />
                  <YAxis
                    type="category"
                    dataKey="team"
                    tick={{
                      fill: '#FFF',
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    width={110}
                    stroke="transparent"
                  />
                  <Tooltip
                    cursor={{ fill: '#ffffff10' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="min-w-[200px] rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-3 shadow-xl">
                          <div
                            className="mb-1.5 text-[13px] font-semibold"
                            style={{ color: d.color, fontFamily: "'Inter', sans-serif" }}
                          >
                            {d.team}
                          </div>
                          <div
                            className="text-[13px] font-semibold text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Median: {formatLapTime(d.medianTime)}
                          </div>
                          <div
                            className="text-[13px] text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            Gap: {d.gap === 0 ? 'LEADER' : `+${d.gap.toFixed(3)}s`}
                          </div>
                          <div
                            className="mt-1 text-[11px] text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {d.lapCount} laps on {d.compound}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="gap"
                    barSize={20}
                    radius={[0, 4, 4, 0]}
                    label={{
                      position: 'right',
                      fill: '#FFF',
                      fontSize: 12,
                      fontWeight: 'bold',
                      fontFamily: "'Inter', sans-serif",
                      formatter: (_: number, __: unknown, index: number) => {
                        const item = compoundBars[index as number];
                        return item
                          ? `${formatLapTime(item.medianTime)}  (${item.lapCount} laps)`
                          : '';
                      },
                    }}
                  >
                    {compoundBars.map((entry) => (
                      <Cell
                        key={entry.teamName}
                        fill={getTeamColor(entry.teamName)}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-[13px] text-white">
              No data for {activeCompound}
            </div>
          )}
        </div>
      )}

      {/* ── SECTOR DOMINANCE VIEW ── */}
      {viewMode === 'sector' && (
        <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
          {sectorData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="w-[140px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white">
                      Team
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                      Sector 1
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                      Sector 2
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                      Sector 3
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-white">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((row, idx) => {
                    const s1 = row.sector1Median ?? 0;
                    const s2 = row.sector2Median ?? 0;
                    const s3 = row.sector3Median ?? 0;
                    const total = s1 + s2 + s3;
                    const bestTotal =
                      (sectorData[0].sector1Median ?? 0) +
                      (sectorData[0].sector2Median ?? 0) +
                      (sectorData[0].sector3Median ?? 0);
                    const totalDelta = total - bestTotal;
                    const teamColor = row.teamColor
                      ? getTeamColor(row.teamName)
                      : getTeamColor(row.teamName);
                    return (
                      <tr
                        key={row.teamName}
                        className="border-b border-white/[0.04] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: teamColor }}
                            />
                            <span className="text-[13px] font-semibold text-white">
                              {row.teamName}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: sectorHeatColor(s1, bestS1) }}
                            >
                              {s1.toFixed(3)}
                            </span>
                            {s1 - bestS1 > 0.001 && (
                              <span className="text-[11px] text-white">
                                +{(s1 - bestS1).toFixed(3)}
                              </span>
                            )}
                            {s1 - bestS1 < 0.001 &&
                              idx ===
                                sectorData.findIndex(
                                  (r) =>
                                    (r.sector1Median ?? 999) ===
                                    Math.min(...sectorData.map((s) => s.sector1Median ?? 999))
                                ) && (
                                <span className="text-[10px] font-semibold text-emerald-400">
                                  BEST
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: sectorHeatColor(s2, bestS2) }}
                            >
                              {s2.toFixed(3)}
                            </span>
                            {s2 - bestS2 > 0.001 && (
                              <span className="text-[11px] text-white">
                                +{(s2 - bestS2).toFixed(3)}
                              </span>
                            )}
                            {s2 - bestS2 < 0.001 &&
                              idx ===
                                sectorData.findIndex(
                                  (r) =>
                                    (r.sector2Median ?? 999) ===
                                    Math.min(...sectorData.map((s) => s.sector2Median ?? 999))
                                ) && (
                                <span className="text-[10px] font-semibold text-emerald-400">
                                  BEST
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: sectorHeatColor(s3, bestS3) }}
                            >
                              {s3.toFixed(3)}
                            </span>
                            {s3 - bestS3 > 0.001 && (
                              <span className="text-[11px] text-white">
                                +{(s3 - bestS3).toFixed(3)}
                              </span>
                            )}
                            {s3 - bestS3 < 0.001 &&
                              idx ===
                                sectorData.findIndex(
                                  (r) =>
                                    (r.sector3Median ?? 999) ===
                                    Math.min(...sectorData.map((s) => s.sector3Median ?? 999))
                                ) && (
                                <span className="text-[10px] font-semibold text-emerald-400">
                                  BEST
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[13px] font-semibold text-white">
                              {formatLapTime(total)}
                            </span>
                            {totalDelta > 0.001 && (
                              <span className="text-[11px] text-white">
                                +{totalDelta.toFixed(3)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-[13px] text-white">
              No sector data available
            </div>
          )}
        </div>
      )}

      {/* ── DRIVER BREAKDOWN VIEW ── */}
      {viewMode === 'drivers' && (
        <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
          {teamRanking.map((teamEntry, teamIdx) => {
            const drivers = driversByTeam[teamEntry.teamName] || [];
            const isExpanded = expandedTeam === teamEntry.teamName;
            const teamBestPace = drivers.length > 0 ? drivers[0].medianTime : 0;
            const teamColor = getTeamColor(teamEntry.teamName);

            return (
              <div
                key={teamEntry.teamName}
                className={teamIdx > 0 ? 'border-t border-white/[0.04]' : ''}
              >
                {/* Team Row */}
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : teamEntry.teamName)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="w-6 text-[13px] font-medium text-white">{teamIdx + 1}</span>
                  <div className="size-3 rounded-full" style={{ backgroundColor: teamColor }} />
                  <span className="flex-1 text-[13px] font-semibold text-white">
                    {teamEntry.teamName}
                  </span>
                  <span className="text-[13px] font-semibold text-white">
                    {formatLapTime(teamEntry.medianTime)}
                  </span>
                  {teamIdx > 0 && (
                    <span className="text-[11px] text-white">
                      +{(teamEntry.medianTime - teamRanking[0].medianTime).toFixed(3)}
                    </span>
                  )}
                  {teamIdx === 0 && (
                    <span className="text-[10px] font-semibold text-emerald-400">FASTEST</span>
                  )}
                  <span className="text-[10px] text-white">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Expanded driver detail */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-white/[0.01] px-4 py-3">
                    {drivers.map((drv, drvIdx) => {
                      const drvColor = driverColor(drv.driverCode, year);
                      const headshot = getDriverImage(drv.driverCode, year);
                      const intraGap = drv.medianTime - teamBestPace;

                      const driverCompounds =
                        paceData?.compoundPace?.filter(
                          (cp) => cp.teamName === teamEntry.teamName
                        ) || [];

                      const teamSector = sectorData.find((s) => s.teamName === teamEntry.teamName);

                      return (
                        <div
                          key={drv.driverCode}
                          className={drvIdx > 0 ? 'mt-3 border-t border-white/[0.04] pt-3' : ''}
                        >
                          <div className="mb-2 flex items-center gap-3">
                            <div
                              className="size-8 shrink-0 overflow-hidden rounded-full border-2 bg-[#1a1a1e]"
                              style={{ borderColor: drvColor }}
                            >
                              {headshot ? (
                                <img
                                  src={headshot}
                                  alt={drv.driverCode}
                                  className="size-full object-cover object-top"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center text-[10px] font-bold text-white">
                                  {drv.driverCode[0]}
                                </div>
                              )}
                            </div>
                            <span className="text-[13px] font-semibold" style={{ color: drvColor }}>
                              {drv.driverCode}
                            </span>
                            <span className="text-[13px] font-semibold text-white">
                              {formatLapTime(drv.medianTime)}
                            </span>
                            {intraGap > 0.001 && (
                              <span className="text-[11px] text-red-400">
                                +{intraGap.toFixed(3)}
                              </span>
                            )}
                            <span className="ml-auto text-[11px] text-white">
                              {drv.lapCount} laps
                            </span>
                          </div>

                          {/* Compound breakdown */}
                          {driverCompounds.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                              {driverCompounds.map((cp) => (
                                <div
                                  key={cp.compound}
                                  className="flex items-center gap-1.5 rounded-md border border-white/[0.06] px-2.5 py-1"
                                >
                                  <span
                                    className="size-2 rounded-full"
                                    style={{
                                      backgroundColor: COMPOUND_COLORS[cp.compound] || '#666',
                                    }}
                                  />
                                  <span
                                    className="text-[11px] font-semibold"
                                    style={{ color: COMPOUND_COLORS[cp.compound] || '#FFF' }}
                                  >
                                    {cp.compound[0]}
                                  </span>
                                  <span className="text-[11px] font-semibold text-white">
                                    {formatLapTime(cp.medianTime)}
                                  </span>
                                  <span className="text-[10px] text-white">({cp.lapCount})</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sector splits */}
                          {teamSector && teamSector.sector1Median && (
                            <div className="flex gap-4">
                              <span className="text-[11px] text-white">
                                S1{' '}
                                <span className="text-white">
                                  {teamSector.sector1Median?.toFixed(3)}
                                </span>
                              </span>
                              <span className="text-[11px] text-white">
                                S2{' '}
                                <span className="text-white">
                                  {teamSector.sector2Median?.toFixed(3)}
                                </span>
                              </span>
                              <span className="text-[11px] text-white">
                                S3{' '}
                                <span className="text-white">
                                  {teamSector.sector3Median?.toFixed(3)}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
