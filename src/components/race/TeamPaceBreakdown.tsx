// knip-ignore
import React, { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import ChartExportMenu from '@/components/charts/ChartExportMenu';
import LoadingSpinnerF1 from '@/components/ui/LoadingSpinnerF1';
import { useChartExport } from '@/hooks/useChartExport';
import { fetchTeamPaceSession } from '@/lib/api';

import { CompoundPaceView } from './team-pace-breakdown/CompoundPaceView';
import { DriverBreakdownView } from './team-pace-breakdown/DriverBreakdownView';
import { SectorDominanceView } from './team-pace-breakdown/SectorDominanceView';
import {
  ViewMode,
  buildCompoundData,
  buildDriversByTeam,
  buildSectorData,
  buildTeamRanking,
  getSectorBestValues,
} from './team-pace-breakdown/utils';

interface TeamPaceBreakdownProps {
  year: number;
  event: string;
  session: string;
}

const VIEW_MODE_LABELS: [ViewMode, string][] = [
  ['compound', 'Compound Pace'],
  ['sector', 'Sector Dominance'],
  ['drivers', 'Driver Breakdown'],
];

export const TeamPaceBreakdown: React.FC<TeamPaceBreakdownProps> = ({ year, event, session }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('compound');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);
  const { chartRef: exportRef, exportChart, isExporting } = useChartExport();

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

  const compoundData = useMemo(() => buildCompoundData(paceData), [paceData]);
  const sectorData = useMemo(() => buildSectorData(paceData), [paceData]);
  const driversByTeam = useMemo(() => buildDriversByTeam(paceData), [paceData]);
  const teamRanking = useMemo(() => buildTeamRanking(paceData), [paceData]);
  const activeCompound = selectedCompound || compoundData.compounds[0] || 'MEDIUM';
  const compoundBars = compoundData.teamData
    .filter((entry) => entry.compound === activeCompound)
    .sort((a, b) => a.medianTime - b.medianTime);
  const { bestS1, bestS2, bestS3 } = getSectorBestValues(sectorData);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinnerF1 />
      </div>
    );
  }

  if (isError || !paceData) {
    return null;
  }

  return (
    <div ref={exportRef} className="space-y-0">
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

      <div
        className="flex overflow-hidden rounded-t-xl border border-white/[0.06] bg-[#0c0c0e]"
        data-export-ignore
      >
        {VIEW_MODE_LABELS.map(([mode, label]) => (
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
            hasData={!!paceData.teamPace.length}
          />
        </div>
      </div>

      {viewMode === 'compound' && (
        <CompoundPaceView
          compounds={compoundData.compounds}
          activeCompound={activeCompound}
          compoundBars={compoundBars}
          onCompoundChange={setSelectedCompound}
        />
      )}

      {viewMode === 'sector' && (
        <SectorDominanceView
          sectorData={sectorData}
          bestS1={bestS1}
          bestS2={bestS2}
          bestS3={bestS3}
        />
      )}

      {viewMode === 'drivers' && (
        <DriverBreakdownView
          year={year}
          expandedTeam={expandedTeam}
          teamRanking={teamRanking}
          driversByTeam={driversByTeam}
          compoundPace={paceData.compoundPace}
          sectorData={sectorData}
          onExpandedTeamChange={setExpandedTeam}
        />
      )}
    </div>
  );
};

export default TeamPaceBreakdown;
