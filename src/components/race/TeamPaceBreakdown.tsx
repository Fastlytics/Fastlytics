import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchLapTimes, fetchSessionDrivers, EnrichedLapRecord } from '@/lib/api';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { driverColor } from '@/lib/driverColor';
import { groupDriversByTeam } from '@/lib/teamUtils';
import { getDriverImage } from '@/utils/imageMapping';

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

  // Fetch all session drivers
  const { data: sessionDrivers } = useQuery({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
  });

  const allDriverCodes = useMemo(() => (sessionDrivers || []).map((d) => d.code), [sessionDrivers]);

  // Group drivers by team
  const teamGroups = useMemo(
    () => groupDriversByTeam(allDriverCodes, year),
    [allDriverCodes, year]
  );

  // Batch by team: each team's drivers fetched as one query (2 drivers each, leverages existing cache)
  const teamEntries = useMemo(
    () => Object.entries(teamGroups).filter(([, d]) => d.length > 0),
    [teamGroups]
  );

  const teamQueries = useQueries({
    queries: teamEntries.map(([team, drivers]) => ({
      queryKey: ['teamPaceLaps', year, event, session, drivers.sort().join(',')],
      queryFn: () => fetchLapTimes(year, event, session, drivers),
      enabled: drivers.length > 0,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = teamQueries.some((q) => q.isLoading);
  const isError = teamQueries.every((q) => q.isError);

  // Merge all per-team results into a single driverLapDetails map
  const driverLapDetails = useMemo(() => {
    const merged: Record<string, EnrichedLapRecord[]> = {};
    teamQueries.forEach((q) => {
      if (q.data?.driverLapDetails) {
        Object.entries(q.data.driverLapDetails).forEach(([drv, records]) => {
          merged[drv] = records;
        });
      }
    });
    return Object.keys(merged).length > 0 ? merged : null;
  }, [teamQueries]);

  // Helper: filter valid race laps (non-deleted, has lapTime, skip lap 1 outliers)
  const validLaps = (records: EnrichedLapRecord[]) =>
    records.filter(
      (l) => l.lapTime != null && !l.deleted && l.lapNumber != null && l.lapNumber > 1
    );

  // IQR-based outlier filter
  const removeOutliers = (times: number[]): number[] => {
    if (times.length < 4) return times;
    const sorted = [...times].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return times.filter((t) => t >= lower && t <= upper);
  };

  // ──────────────────────────────────────────
  // COMPOUND PACE DATA
  // ──────────────────────────────────────────
  const compoundData = useMemo(() => {
    if (!driverLapDetails)
      return {
        compounds: [] as string[],
        teamData: [] as {
          team: string;
          compound: string;
          avgPace: number;
          lapCount: number;
          color: string;
        }[],
      };
    const compounds = new Set<string>();
    const rows: {
      team: string;
      compound: string;
      avgPace: number;
      lapCount: number;
      color: string;
    }[] = [];

    Object.entries(teamGroups).forEach(([team, drivers]) => {
      // Gather all valid laps for this team
      const teamLaps = drivers.flatMap((drv) => validLaps(driverLapDetails[drv] || []));
      // Group by compound
      const byCompound = new Map<string, number[]>();
      teamLaps.forEach((l) => {
        if (l.compound && l.lapTime != null) {
          if (!byCompound.has(l.compound)) byCompound.set(l.compound, []);
          byCompound.get(l.compound)!.push(l.lapTime!);
        }
      });
      byCompound.forEach((times, comp) => {
        compounds.add(comp);
        const cleaned = removeOutliers(times);
        if (cleaned.length > 0) {
          const avg = cleaned.reduce((a, b) => a + b, 0) / cleaned.length;
          rows.push({
            team,
            compound: comp,
            avgPace: avg,
            lapCount: cleaned.length,
            color: getTeamColor(team),
          });
        }
      });
    });

    return {
      compounds: Array.from(compounds).sort((a, b) => {
        const order = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
        return order.indexOf(a) - order.indexOf(b);
      }),
      teamData: rows,
    };
  }, [driverLapDetails, teamGroups]);

  // ──────────────────────────────────────────
  // SECTOR DOMINANCE DATA
  // ──────────────────────────────────────────
  const sectorData = useMemo(() => {
    if (!driverLapDetails)
      return [] as { team: string; s1: number; s2: number; s3: number; color: string }[];
    const rows: { team: string; s1: number; s2: number; s3: number; color: string }[] = [];

    Object.entries(teamGroups).forEach(([team, drivers]) => {
      const teamLaps = drivers.flatMap((drv) => validLaps(driverLapDetails[drv] || []));
      const s1Times = removeOutliers(
        teamLaps.filter((l) => l.sector1 != null).map((l) => l.sector1!)
      );
      const s2Times = removeOutliers(
        teamLaps.filter((l) => l.sector2 != null).map((l) => l.sector2!)
      );
      const s3Times = removeOutliers(
        teamLaps.filter((l) => l.sector3 != null).map((l) => l.sector3!)
      );

      if (s1Times.length > 0 && s2Times.length > 0 && s3Times.length > 0) {
        rows.push({
          team,
          s1: s1Times.reduce((a, b) => a + b, 0) / s1Times.length,
          s2: s2Times.reduce((a, b) => a + b, 0) / s2Times.length,
          s3: s3Times.reduce((a, b) => a + b, 0) / s3Times.length,
          color: getTeamColor(team),
        });
      }
    });

    return rows.sort((a, b) => a.s1 + a.s2 + a.s3 - (b.s1 + b.s2 + b.s3));
  }, [driverLapDetails, teamGroups]);

  // ──────────────────────────────────────────
  // DRIVER BREAKDOWN DATA
  // ──────────────────────────────────────────
  const driverBreakdown = useMemo(() => {
    if (!driverLapDetails)
      return {} as Record<
        string,
        {
          driver: string;
          avgPace: number;
          bestLap: number;
          laps: number;
          compounds: Record<string, { avg: number; count: number }>;
          sectors: { s1: number; s2: number; s3: number };
        }[]
      >;
    const result: Record<
      string,
      {
        driver: string;
        avgPace: number;
        bestLap: number;
        laps: number;
        compounds: Record<string, { avg: number; count: number }>;
        sectors: { s1: number; s2: number; s3: number };
      }[]
    > = {};

    Object.entries(teamGroups).forEach(([team, drivers]) => {
      result[team] = drivers
        .map((drv) => {
          const laps = validLaps(driverLapDetails[drv] || []);
          const times = removeOutliers(
            laps.filter((l) => l.lapTime != null).map((l) => l.lapTime!)
          );
          const s1 = removeOutliers(laps.filter((l) => l.sector1 != null).map((l) => l.sector1!));
          const s2 = removeOutliers(laps.filter((l) => l.sector2 != null).map((l) => l.sector2!));
          const s3 = removeOutliers(laps.filter((l) => l.sector3 != null).map((l) => l.sector3!));

          // Per-compound
          const byComp: Record<string, { avg: number; count: number }> = {};
          const compMap = new Map<string, number[]>();
          laps.forEach((l) => {
            if (l.compound && l.lapTime != null) {
              if (!compMap.has(l.compound)) compMap.set(l.compound, []);
              compMap.get(l.compound)!.push(l.lapTime!);
            }
          });
          compMap.forEach((t, c) => {
            const cl = removeOutliers(t);
            if (cl.length > 0)
              byComp[c] = { avg: cl.reduce((a, b) => a + b, 0) / cl.length, count: cl.length };
          });

          return {
            driver: drv,
            avgPace: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
            bestLap: times.length > 0 ? Math.min(...times) : 0,
            laps: times.length,
            compounds: byComp,
            sectors: {
              s1: s1.length > 0 ? s1.reduce((a, b) => a + b, 0) / s1.length : 0,
              s2: s2.length > 0 ? s2.reduce((a, b) => a + b, 0) / s2.length : 0,
              s3: s3.length > 0 ? s3.reduce((a, b) => a + b, 0) / s3.length : 0,
            },
          };
        })
        .sort((a, b) => a.avgPace - b.avgPace);
    });

    return result;
  }, [driverLapDetails, teamGroups]);

  // Overall team ranking by avg pace
  const teamRanking = useMemo(() => {
    if (!driverLapDetails) return [] as { team: string; avgPace: number; color: string }[];
    return Object.entries(teamGroups)
      .map(([team, drivers]) => {
        const teamLaps = drivers.flatMap((drv) => validLaps(driverLapDetails[drv] || []));
        const times = removeOutliers(
          teamLaps.filter((l) => l.lapTime != null).map((l) => l.lapTime!)
        );
        const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : Infinity;
        return { team, avgPace: avg, color: getTeamColor(team) };
      })
      .filter((t) => t.avgPace < Infinity)
      .sort((a, b) => a.avgPace - b.avgPace);
  }, [driverLapDetails, teamGroups]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinnerF1 />
      </div>
    );
  }
  if (isError || !driverLapDetails) return null;

  // Determine active compound or default to first
  const activeCompound = selectedCompound || compoundData.compounds[0] || 'MEDIUM';
  const compoundBars = compoundData.teamData
    .filter((d) => d.compound === activeCompound)
    .sort((a, b) => a.avgPace - b.avgPace);

  // Sector best values (for heatmap coloring)
  const bestS1 = sectorData.length > 0 ? Math.min(...sectorData.map((d) => d.s1)) : 0;
  const bestS2 = sectorData.length > 0 ? Math.min(...sectorData.map((d) => d.s2)) : 0;
  const bestS3 = sectorData.length > 0 ? Math.min(...sectorData.map((d) => d.s3)) : 0;

  const sectorHeatColor = (val: number, best: number): string => {
    const delta = val - best;
    if (delta < 0.05) return '#22c55e'; // green - fastest
    if (delta < 0.15) return '#86efac'; // light green
    if (delta < 0.3) return '#fbbf24'; // yellow
    if (delta < 0.5) return '#f97316'; // orange
    return '#ef4444'; // red - slowest
  };

  const refPace = compoundBars.length > 0 ? compoundBars[0].avgPace : 0;

  return (
    <div className="space-y-0">
      {/* View Mode Tabs */}
      <div className="flex border border-gray-700 bg-black">
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
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider transition-all ${
              viewMode === mode
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── COMPOUND PACE VIEW ── */}
      {viewMode === 'compound' && (
        <div className="bg-black border-x border-b border-gray-700">
          {/* Compound Selector */}
          <div className="flex border-b border-gray-700">
            {compoundData.compounds.map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedCompound(comp)}
                className={`flex-1 py-2.5 text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeCompound === comp
                    ? 'border-b-2 text-white'
                    : 'text-gray-500 hover:text-white'
                }`}
                style={
                  activeCompound === comp
                    ? { borderBottomColor: COMPOUND_COLORS[comp] || '#FFF' }
                    : undefined
                }
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COMPOUND_COLORS[comp] || '#666' }}
                />
                {comp}
              </button>
            ))}
          </div>

          {/* Bar Chart: Team avg pace on selected compound */}
          {compoundBars.length > 0 ? (
            <div className="px-4 py-3">
              <ResponsiveContainer width="100%" height={Math.max(200, compoundBars.length * 48)}>
                <BarChart
                  data={compoundBars.map((d) => ({
                    ...d,
                    gap: d.avgPace - refPace,
                    displayTime: formatLapTime(d.avgPace),
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
                  barGap={3}
                >
                  <XAxis
                    type="number"
                    dataKey="gap"
                    domain={[0, 'dataMax + 0.1']}
                    tick={{ fill: '#FFF', fontSize: 12, fontWeight: 'bold', fontFamily: 'Geist' }}
                    stroke="#444"
                    tickFormatter={(v: number) => (v === 0 ? '0' : `+${v.toFixed(3)}`)}
                  />
                  <YAxis
                    type="category"
                    dataKey="team"
                    tick={{ fill: '#FFF', fontSize: 13, fontWeight: 900, fontFamily: 'Geist Mono' }}
                    width={110}
                    stroke="transparent"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111',
                      border: '1px solid #555',
                      fontSize: 14,
                      fontWeight: 'bold',
                      fontFamily: 'Geist',
                    }}
                    cursor={{ fill: '#ffffff10' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-black border border-gray-600 p-3 shadow-xl min-w-[200px]">
                          <div className="text-sm font-black mb-1.5" style={{ color: d.color }}>
                            {d.team}
                          </div>
                          <div className="text-sm font-mono text-white font-bold">
                            Avg: {formatLapTime(d.avgPace)}
                          </div>
                          <div className="text-sm font-mono text-gray-300">
                            Gap: {d.gap === 0 ? 'LEADER' : `+${d.gap.toFixed(3)}s`}
                          </div>
                          <div className="text-xs font-mono text-gray-400 mt-1">
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
                      fontFamily: 'Geist Mono',
                      formatter: (_: number, __: unknown, index: number) => {
                        const item = compoundBars[index as number];
                        return item ? formatLapTime(item.avgPace) : '';
                      },
                    }}
                  >
                    {compoundBars.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} fillOpacity={idx === 0 ? 1 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500 font-mono text-sm">
              No data for {activeCompound}
            </div>
          )}
        </div>
      )}

      {/* ── SECTOR DOMINANCE VIEW ── */}
      {viewMode === 'sector' && (
        <div className="bg-black border-x border-b border-gray-700">
          {sectorData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-4 py-3 text-sm font-black uppercase text-gray-400 w-[140px]">
                      Team
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-black uppercase text-gray-400">
                      Sector 1
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-black uppercase text-gray-400">
                      Sector 2
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-black uppercase text-gray-400">
                      Sector 3
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-black uppercase text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map((row, idx) => {
                    const total = row.s1 + row.s2 + row.s3;
                    const bestTotal = sectorData[0].s1 + sectorData[0].s2 + sectorData[0].s3;
                    const totalDelta = total - bestTotal;
                    return (
                      <tr
                        key={row.team}
                        className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="text-sm font-black font-mono text-white">
                              {row.team}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: sectorHeatColor(row.s1, bestS1) }}
                            >
                              {row.s1.toFixed(3)}
                            </span>
                            {row.s1 - bestS1 > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
                                +{(row.s1 - bestS1).toFixed(3)}
                              </span>
                            )}
                            {row.s1 - bestS1 < 0.001 &&
                              idx ===
                                sectorData.findIndex(
                                  (r) => r.s1 === Math.min(...sectorData.map((s) => s.s1))
                                ) && (
                                <span className="text-[10px] font-black text-green-400">BEST</span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: sectorHeatColor(row.s2, bestS2) }}
                            >
                              {row.s2.toFixed(3)}
                            </span>
                            {row.s2 - bestS2 > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
                                +{(row.s2 - bestS2).toFixed(3)}
                              </span>
                            )}
                            {row.s2 - bestS2 < 0.001 &&
                              idx ===
                                sectorData.findIndex(
                                  (r) => r.s2 === Math.min(...sectorData.map((s) => s.s2))
                                ) && (
                                <span className="text-[10px] font-black text-green-400">BEST</span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: sectorHeatColor(row.s3, bestS3) }}
                            >
                              {row.s3.toFixed(3)}
                            </span>
                            {row.s3 - bestS3 > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
                                +{(row.s3 - bestS3).toFixed(3)}
                              </span>
                            )}
                            {row.s3 - bestS3 < 0.001 &&
                              idx ===
                                sectorData.findIndex(
                                  (r) => r.s3 === Math.min(...sectorData.map((s) => s.s3))
                                ) && (
                                <span className="text-[10px] font-black text-green-400">BEST</span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-black font-mono text-white">
                              {formatLapTime(total)}
                            </span>
                            {totalDelta > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
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
            <div className="flex items-center justify-center h-32 text-gray-500 font-mono text-sm">
              No sector data available
            </div>
          )}
        </div>
      )}

      {/* ── DRIVER BREAKDOWN VIEW ── */}
      {viewMode === 'drivers' && (
        <div className="bg-black border-x border-b border-gray-700">
          {teamRanking.map((teamEntry, teamIdx) => {
            const drivers = driverBreakdown[teamEntry.team] || [];
            const isExpanded = expandedTeam === teamEntry.team;
            const teamBestPace = drivers.length > 0 ? drivers[0].avgPace : 0;

            return (
              <div key={teamEntry.team} className={teamIdx > 0 ? 'border-t border-gray-700' : ''}>
                {/* Team Row — clickable */}
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : teamEntry.team)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors text-left"
                >
                  <span className="text-sm font-black text-gray-500 w-6">{teamIdx + 1}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: teamEntry.color }}
                  />
                  <span className="text-sm font-black font-mono text-white flex-1">
                    {teamEntry.team}
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {formatLapTime(teamEntry.avgPace)}
                  </span>
                  {teamIdx > 0 && (
                    <span className="text-xs font-mono font-bold text-gray-400">
                      +{(teamEntry.avgPace - teamRanking[0].avgPace).toFixed(3)}
                    </span>
                  )}
                  {teamIdx === 0 && (
                    <span className="text-xs font-black text-green-400">FASTEST</span>
                  )}
                  <span className="text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Expanded driver detail */}
                {isExpanded && (
                  <div className="bg-gray-950 border-t border-gray-800 px-4 py-3">
                    {drivers.map((drv, drvIdx) => {
                      const drvColor = driverColor(drv.driver, year);
                      const headshot = getDriverImage(drv.driver, year);
                      const intraGap = drv.avgPace - teamBestPace;

                      return (
                        <div
                          key={drv.driver}
                          className={`${drvIdx > 0 ? 'mt-3 pt-3 border-t border-gray-800' : ''}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border-2 shrink-0"
                              style={{ borderColor: drvColor }}
                            >
                              {headshot ? (
                                <img
                                  src={headshot}
                                  alt={drv.driver}
                                  className="w-full h-full object-cover object-top"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">
                                  {drv.driver[0]}
                                </div>
                              )}
                            </div>
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: drvColor }}
                            >
                              {drv.driver}
                            </span>
                            <span className="text-sm font-mono font-bold text-white">
                              {formatLapTime(drv.avgPace)}
                            </span>
                            {intraGap > 0.001 && (
                              <span className="text-xs font-mono text-red-400">
                                +{intraGap.toFixed(3)}
                              </span>
                            )}
                            <span className="text-xs font-mono text-gray-500 ml-auto">
                              {drv.laps} laps
                            </span>
                          </div>

                          {/* Compound breakdown */}
                          <div className="flex gap-2 flex-wrap mb-2">
                            {Object.entries(drv.compounds).map(([comp, data]) => (
                              <div
                                key={comp}
                                className="flex items-center gap-1.5 border border-gray-800 px-2.5 py-1"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: COMPOUND_COLORS[comp] || '#666' }}
                                />
                                <span
                                  className="text-xs font-black"
                                  style={{ color: COMPOUND_COLORS[comp] || '#FFF' }}
                                >
                                  {comp[0]}
                                </span>
                                <span className="text-xs font-mono text-white font-bold">
                                  {formatLapTime(data.avg)}
                                </span>
                                <span className="text-[10px] font-mono text-gray-500">
                                  ({data.count})
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Sector splits */}
                          {drv.sectors.s1 > 0 && (
                            <div className="flex gap-4">
                              <span className="text-xs font-mono text-gray-300 font-bold">
                                S1 <span className="text-white">{drv.sectors.s1.toFixed(3)}</span>
                              </span>
                              <span className="text-xs font-mono text-gray-300 font-bold">
                                S2 <span className="text-white">{drv.sectors.s2.toFixed(3)}</span>
                              </span>
                              <span className="text-xs font-mono text-gray-300 font-bold">
                                S3 <span className="text-white">{drv.sectors.s3.toFixed(3)}</span>
                              </span>
                              <span className="text-xs font-mono text-gray-400">
                                Best: {formatLapTime(drv.bestLap)}
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

export default TeamPaceBreakdown;
