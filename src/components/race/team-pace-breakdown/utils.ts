import type {
  CompoundPace,
  DriverPace,
  SectorPace,
  TeamPaceResponse,
  TeamPaceSession,
} from '@/lib/api';

export const COMPOUND_COLORS: Record<string, string> = {
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

export type ViewMode = 'compound' | 'sector' | 'drivers';

export const getTeamColor = (team: string): string => TEAM_COLORS[team] || '#666666';

export const formatLapTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toFixed(3).padStart(6, '0')}` : secs.toFixed(3);
};

export const buildCompoundData = (paceData?: TeamPaceResponse | null) => {
  if (!paceData?.compoundPace) {
    return { compounds: [] as string[], teamData: [] as (CompoundPace & { color: string })[] };
  }

  const compounds = Array.from(
    new Set(paceData.compoundPace.map((dataPoint) => dataPoint.compound))
  ).sort((a, b) => {
    const order = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const teamData = paceData.compoundPace.map((dataPoint) => ({
    ...dataPoint,
    color: getTeamColor(dataPoint.teamName),
  }));

  return { compounds, teamData };
};

export const buildSectorData = (paceData?: TeamPaceResponse | null) => {
  if (!paceData?.sectorPace) return [] as SectorPace[];

  return [...paceData.sectorPace].sort((a, b) => {
    const totalA = (a.sector1Median ?? 999) + (a.sector2Median ?? 999) + (a.sector3Median ?? 999);
    const totalB = (b.sector1Median ?? 999) + (b.sector2Median ?? 999) + (b.sector3Median ?? 999);
    return totalA - totalB;
  });
};

export const buildDriversByTeam = (paceData?: TeamPaceResponse | null) => {
  if (!paceData?.driverPace) return {} as Record<string, DriverPace[]>;

  const grouped: Record<string, DriverPace[]> = {};
  paceData.driverPace.forEach((driver) => {
    if (!grouped[driver.teamName]) grouped[driver.teamName] = [];
    grouped[driver.teamName].push(driver);
  });

  Object.values(grouped).forEach((drivers) => drivers.sort((a, b) => a.medianTime - b.medianTime));
  return grouped;
};

export const buildTeamRanking = (paceData?: TeamPaceResponse | null) => {
  if (!paceData?.teamPace) return [] as TeamPaceSession[];
  return [...paceData.teamPace].sort((a, b) => a.medianTime - b.medianTime);
};

export const getSectorBestValues = (sectorData: SectorPace[]) => ({
  bestS1: sectorData.length ? Math.min(...sectorData.map((row) => row.sector1Median ?? 999)) : 0,
  bestS2: sectorData.length ? Math.min(...sectorData.map((row) => row.sector2Median ?? 999)) : 0,
  bestS3: sectorData.length ? Math.min(...sectorData.map((row) => row.sector3Median ?? 999)) : 0,
});

export const getSectorHeatColor = (value: number, best: number): string => {
  const delta = value - best;
  if (delta < 0.05) return '#22c55e';
  if (delta < 0.15) return '#86efac';
  if (delta < 0.3) return '#fbbf24';
  if (delta < 0.5) return '#f97316';
  return '#ef4444';
};
