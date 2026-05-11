import { PointsSystemDefinition } from '@/lib/types/career-analytics';

// === Points System Definitions ===

export const POINTS_SYSTEMS: PointsSystemDefinition[] = [
  {
    id: 'pre-2003',
    name: 'Pre-2003 System',
    era: '1991-2002',
    positions: {
      1: 10,
      2: 6,
      3: 4,
      4: 3,
      5: 2,
      6: 1,
    },
  },
  {
    id: '2003-2009',
    name: '2003-2009 System',
    era: '2003-2009',
    positions: {
      1: 10,
      2: 8,
      3: 6,
      4: 5,
      5: 4,
      6: 3,
      7: 2,
      8: 1,
    },
  },
  {
    id: '2010-2018',
    name: '2010-2018 System',
    era: '2010-2018',
    positions: {
      1: 25,
      2: 18,
      3: 15,
      4: 12,
      5: 10,
      6: 8,
      7: 6,
      8: 4,
      9: 2,
      10: 1,
    },
  },
  {
    id: '2019-present',
    name: '2019+ with Fastest Lap',
    era: '2019+',
    positions: {
      1: 25,
      2: 18,
      3: 15,
      4: 12,
      5: 10,
      6: 8,
      7: 6,
      8: 4,
      9: 2,
      10: 1,
    },
    fastestLapBonus: { points: 1, topN: 10 },
  },
  {
    id: 'sprint-era-2021',
    name: 'Sprint Era 2021+',
    era: '2021+',
    positions: {
      1: 25,
      2: 18,
      3: 15,
      4: 12,
      5: 10,
      6: 8,
      7: 6,
      8: 4,
      9: 2,
      10: 1,
    },
    fastestLapBonus: { points: 1, topN: 10 },
    sprintPositions: {
      1: 8,
      2: 7,
      3: 6,
      4: 5,
      5: 4,
      6: 3,
      7: 2,
      8: 1,
    },
  },
];

// === All-Time Greats List ===
// Curated list of historically significant drivers for consistency comparison

export interface AllTimeGreatDriver {
  slug: string;
  name: string;
  code: string;
}

export const ALL_TIME_GREATS: AllTimeGreatDriver[] = [
  { slug: 'michael-schumacher', name: 'Michael Schumacher', code: 'MSC' },
  { slug: 'lewis-hamilton', name: 'Lewis Hamilton', code: 'HAM' },
  { slug: 'ayrton-senna', name: 'Ayrton Senna', code: 'SEN' },
  { slug: 'alain-prost', name: 'Alain Prost', code: 'PRO' },
  { slug: 'max-verstappen', name: 'Max Verstappen', code: 'VER' },
  { slug: 'sebastian-vettel', name: 'Sebastian Vettel', code: 'VET' },
  { slug: 'fernando-alonso', name: 'Fernando Alonso', code: 'ALO' },
  { slug: 'jim-clark', name: 'Jim Clark', code: 'CLK' },
  { slug: 'juan-manuel-fangio', name: 'Juan Manuel Fangio', code: 'FAN' },
  { slug: 'niki-lauda', name: 'Niki Lauda', code: 'LAU' },
  { slug: 'jackie-stewart', name: 'Jackie Stewart', code: 'STW' },
  { slug: 'nelson-piquet', name: 'Nelson Piquet', code: 'PIQ' },
];

// === Era Thresholds for Points-Paying Positions ===
// Used by streak analyzer to determine what counts as a "points finish"

export interface EraPointsThreshold {
  startYear: number;
  endYear: number;
  topN: number; // positions that score points
}

export const ERA_POINTS_THRESHOLDS: EraPointsThreshold[] = [
  { startYear: 1950, endYear: 2002, topN: 6 },
  { startYear: 2003, endYear: 2009, topN: 8 },
  { startYear: 2010, endYear: 9999, topN: 10 },
];

/**
 * Returns the number of points-paying positions for a given season.
 */
export function getPointsPayingPositions(season: number): number {
  const threshold = ERA_POINTS_THRESHOLDS.find((t) => season >= t.startYear && season <= t.endYear);
  return threshold ? threshold.topN : 10;
}

/**
 * Returns the points system definition for a given system ID.
 */
export function getPointsSystem(systemId: string): PointsSystemDefinition | undefined {
  return POINTS_SYSTEMS.find((s) => s.id === systemId);
}
