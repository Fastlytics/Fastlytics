import { driverColor } from '@/lib/driverColor';
import { getDriverImage } from '@/utils/imageMapping';

import type { CompoundPace, DriverPace, SectorPace, TeamPaceSession } from '@/lib/api';

import { COMPOUND_COLORS, formatLapTime, getTeamColor } from './utils';

interface DriverBreakdownViewProps {
  year: number;
  expandedTeam: string | null;
  teamRanking: TeamPaceSession[];
  driversByTeam: Record<string, DriverPace[]>;
  compoundPace: CompoundPace[];
  sectorData: SectorPace[];
  onExpandedTeamChange: (teamName: string | null) => void;
}

export const DriverBreakdownView = ({
  year,
  expandedTeam,
  teamRanking,
  driversByTeam,
  compoundPace,
  sectorData,
  onExpandedTeamChange,
}: DriverBreakdownViewProps) => (
  <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-[#0c0c0e]">
    {teamRanking.map((teamEntry, teamIndex) => {
      const drivers = driversByTeam[teamEntry.teamName] || [];
      const isExpanded = expandedTeam === teamEntry.teamName;
      const teamBestPace = drivers.length > 0 ? drivers[0].medianTime : 0;
      const teamSector = sectorData.find((sector) => sector.teamName === teamEntry.teamName);
      const driverCompounds = compoundPace.filter(
        (compound) => compound.teamName === teamEntry.teamName
      );

      return (
        <div
          key={teamEntry.teamName}
          className={teamIndex > 0 ? 'border-t border-white/[0.04]' : ''}
        >
          <button
            onClick={() => onExpandedTeamChange(isExpanded ? null : teamEntry.teamName)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
          >
            <span className="w-6 text-[13px] font-medium text-white">{teamIndex + 1}</span>
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: getTeamColor(teamEntry.teamName) }}
            />
            <span className="flex-1 text-[13px] font-semibold text-white">
              {teamEntry.teamName}
            </span>
            <span className="text-[13px] font-semibold text-white">
              {formatLapTime(teamEntry.medianTime)}
            </span>
            {teamIndex > 0 && (
              <span className="text-[11px] text-white">
                +{(teamEntry.medianTime - teamRanking[0].medianTime).toFixed(3)}
              </span>
            )}
            {teamIndex === 0 && (
              <span className="text-[10px] font-semibold text-emerald-400">FASTEST</span>
            )}
            <span className="text-[10px] text-white">{isExpanded ? '▲' : '▼'}</span>
          </button>

          {isExpanded && (
            <div className="border-t border-white/[0.04] bg-white/[0.01] px-4 py-3">
              {drivers.map((driverEntry, driverIndex) => {
                const driverAccent = driverColor(driverEntry.driverCode, year);
                const headshot = getDriverImage(driverEntry.driverCode, year);
                const intraGap = driverEntry.medianTime - teamBestPace;

                return (
                  <div
                    key={driverEntry.driverCode}
                    className={driverIndex > 0 ? 'mt-3 border-t border-white/[0.04] pt-3' : ''}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div
                        className="size-8 shrink-0 overflow-hidden rounded-full border-2 bg-[#1a1a1e]"
                        style={{ borderColor: driverAccent }}
                      >
                        {headshot ? (
                          <img
                            src={headshot}
                            alt={driverEntry.driverCode}
                            className="size-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[10px] font-bold text-white">
                            {driverEntry.driverCode[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: driverAccent }}>
                        {driverEntry.driverCode}
                      </span>
                      <span className="text-[13px] font-semibold text-white">
                        {formatLapTime(driverEntry.medianTime)}
                      </span>
                      {intraGap > 0.001 && (
                        <span className="text-[11px] text-red-400">+{intraGap.toFixed(3)}</span>
                      )}
                      <span className="ml-auto text-[11px] text-white">
                        {driverEntry.lapCount} laps
                      </span>
                    </div>

                    {driverCompounds.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {driverCompounds.map((compound) => (
                          <div
                            key={compound.compound}
                            className="flex items-center gap-1.5 rounded-md border border-white/[0.06] px-2.5 py-1"
                          >
                            <span
                              className="size-2 rounded-full"
                              style={{
                                backgroundColor: COMPOUND_COLORS[compound.compound] || '#666',
                              }}
                            />
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: COMPOUND_COLORS[compound.compound] || '#FFF' }}
                            >
                              {compound.compound[0]}
                            </span>
                            <span className="text-[11px] font-semibold text-white">
                              {formatLapTime(compound.medianTime)}
                            </span>
                            <span className="text-[10px] text-white">({compound.lapCount})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {teamSector?.sector1Median && (
                      <div className="flex gap-4">
                        <span className="text-[11px] text-white">
                          S1{' '}
                          <span className="text-white">{teamSector.sector1Median.toFixed(3)}</span>
                        </span>
                        <span className="text-[11px] text-white">
                          S2{' '}
                          <span className="text-white">{teamSector.sector2Median?.toFixed(3)}</span>
                        </span>
                        <span className="text-[11px] text-white">
                          S3{' '}
                          <span className="text-white">{teamSector.sector3Median?.toFixed(3)}</span>
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
);
