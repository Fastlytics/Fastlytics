import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
    const compounds = [...new Set(paceData.compoundPace.map((d) => d.compound))].sort((a, b) => {
      const order = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
      return order.indexOf(a) - order.indexOf(b);
    });
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
    return [...paceData.sectorPace].sort((a, b) => {
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
    return [...paceData.teamPace].sort((a, b) => a.medianTime - b.medianTime);
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
                            Median: {formatLapTime(d.medianTime)}
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
                        return item ? formatLapTime(item.medianTime) : '';
                      },
                    }}
                  >
                    {compoundBars.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={getTeamColor(entry.teamName)}
                        fillOpacity={idx === 0 ? 1 : 0.7}
                      />
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
                        className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: teamColor }}
                            />
                            <span className="text-sm font-black font-mono text-white">
                              {row.teamName}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: sectorHeatColor(s1, bestS1) }}
                            >
                              {s1.toFixed(3)}
                            </span>
                            {s1 - bestS1 > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
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
                                <span className="text-[10px] font-black text-green-400">BEST</span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: sectorHeatColor(s2, bestS2) }}
                            >
                              {s2.toFixed(3)}
                            </span>
                            {s2 - bestS2 > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
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
                                <span className="text-[10px] font-black text-green-400">BEST</span>
                              )}
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: sectorHeatColor(s3, bestS3) }}
                            >
                              {s3.toFixed(3)}
                            </span>
                            {s3 - bestS3 > 0.001 && (
                              <span className="text-xs font-mono text-gray-500">
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
            const drivers = driversByTeam[teamEntry.teamName] || [];
            const isExpanded = expandedTeam === teamEntry.teamName;
            const teamBestPace = drivers.length > 0 ? drivers[0].medianTime : 0;
            const teamColor = getTeamColor(teamEntry.teamName);

            return (
              <div
                key={teamEntry.teamName}
                className={teamIdx > 0 ? 'border-t border-gray-700' : ''}
              >
                {/* Team Row — clickable */}
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : teamEntry.teamName)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors text-left"
                >
                  <span className="text-sm font-black text-gray-500 w-6">{teamIdx + 1}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: teamColor }}
                  />
                  <span className="text-sm font-black font-mono text-white flex-1">
                    {teamEntry.teamName}
                  </span>
                  <span className="text-sm font-mono font-bold text-white">
                    {formatLapTime(teamEntry.medianTime)}
                  </span>
                  {teamIdx > 0 && (
                    <span className="text-xs font-mono font-bold text-gray-400">
                      +{(teamEntry.medianTime - teamRanking[0].medianTime).toFixed(3)}
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
                      const drvColor = driverColor(drv.driverCode, year);
                      const headshot = getDriverImage(drv.driverCode, year);
                      const intraGap = drv.medianTime - teamBestPace;

                      // Find this driver's compound breakdown from backend data
                      const driverCompounds =
                        paceData?.compoundPace?.filter(
                          (cp) => cp.teamName === teamEntry.teamName
                        ) || [];

                      // Find this driver's sector data (approximate from team-level)
                      const teamSector = sectorData.find((s) => s.teamName === teamEntry.teamName);

                      return (
                        <div
                          key={drv.driverCode}
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
                                  alt={drv.driverCode}
                                  className="w-full h-full object-cover object-top"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-mono font-bold">
                                  {drv.driverCode[0]}
                                </div>
                              )}
                            </div>
                            <span
                              className="text-sm font-black font-mono"
                              style={{ color: drvColor }}
                            >
                              {drv.driverCode}
                            </span>
                            <span className="text-sm font-mono font-bold text-white">
                              {formatLapTime(drv.medianTime)}
                            </span>
                            {intraGap > 0.001 && (
                              <span className="text-xs font-mono text-red-400">
                                +{intraGap.toFixed(3)}
                              </span>
                            )}
                            <span className="text-xs font-mono text-gray-500 ml-auto">
                              {drv.lapCount} laps
                            </span>
                          </div>

                          {/* Compound breakdown (team-level from backend) */}
                          {driverCompounds.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-2">
                              {driverCompounds.map((cp) => (
                                <div
                                  key={cp.compound}
                                  className="flex items-center gap-1.5 border border-gray-800 px-2.5 py-1"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: COMPOUND_COLORS[cp.compound] || '#666',
                                    }}
                                  />
                                  <span
                                    className="text-xs font-black"
                                    style={{ color: COMPOUND_COLORS[cp.compound] || '#FFF' }}
                                  >
                                    {cp.compound[0]}
                                  </span>
                                  <span className="text-xs font-mono text-white font-bold">
                                    {formatLapTime(cp.medianTime)}
                                  </span>
                                  <span className="text-[10px] font-mono text-gray-500">
                                    ({cp.lapCount})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sector splits */}
                          {teamSector && teamSector.sector1Median && (
                            <div className="flex gap-4">
                              <span className="text-xs font-mono text-gray-300 font-bold">
                                S1{' '}
                                <span className="text-white">
                                  {teamSector.sector1Median?.toFixed(3)}
                                </span>
                              </span>
                              <span className="text-xs font-mono text-gray-300 font-bold">
                                S2{' '}
                                <span className="text-white">
                                  {teamSector.sector2Median?.toFixed(3)}
                                </span>
                              </span>
                              <span className="text-xs font-mono text-gray-300 font-bold">
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

export default TeamPaceBreakdown;
