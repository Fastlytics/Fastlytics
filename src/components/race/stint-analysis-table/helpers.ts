import { getCompoundColor } from '@/lib/utils';
import { driverColor } from '@/lib/driverColor';

import type { LapDetail, StintAnalysisData } from '@/lib/api';

export interface ProcessedStint extends StintAnalysisData {
  id: string;
  stintLength: number;
  avgLapTime: number | null;
  fastestLap: number | null;
  consistency: number | null;
  degradation: number | null;
  driverColor: string;
  compoundColor: string;
}

export const formatLapTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) {
    return 'N/A';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const calculateStdDev = (values: number[]): number | null => {
  if (values.length < 2) return null;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const calculateDegradation = (lapDetails: LapDetail[]): number | null => {
  const validLaps = lapDetails.length > 2 ? lapDetails.slice(1, -1) : [];
  if (validLaps.length < 2) return null;

  const n = validLaps.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  validLaps.forEach((lap) => {
    sumX += lap.lapNumber;
    sumY += lap.lapTime;
    sumXY += lap.lapNumber * lap.lapTime;
    sumX2 += lap.lapNumber * lap.lapNumber;
  });

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
};

export const buildProcessedStints = (
  rawStintData: StintAnalysisData[] | undefined,
  year: number
) => {
  if (!rawStintData) return [] as ProcessedStint[];

  return rawStintData
    .map((stint) => {
      const allValidLapDetails = stint.lapDetails;
      const allValidLapTimes = allValidLapDetails.map((detail) => detail.lapTime);
      const fastLapDetails = allValidLapDetails.length > 2 ? allValidLapDetails.slice(1, -1) : [];
      const fastLapTimes = fastLapDetails.map((detail) => detail.lapTime);

      return {
        ...stint,
        id: `${stint.driverCode}-${stint.stintNumber}`,
        stintLength: stint.endLap - stint.startLap + 1,
        avgLapTime:
          fastLapTimes.length > 0
            ? fastLapTimes.reduce((sum, value) => sum + value, 0) / fastLapTimes.length
            : null,
        fastestLap: allValidLapTimes.length > 0 ? Math.min(...allValidLapTimes) : null,
        consistency: calculateStdDev(fastLapTimes),
        degradation: calculateDegradation(allValidLapDetails),
        driverColor: driverColor(stint.driverCode, year),
        compoundColor: getCompoundColor(stint.compound),
      };
    })
    .sort((a, b) => {
      if (a.driverCode < b.driverCode) return -1;
      if (a.driverCode > b.driverCode) return 1;
      return a.stintNumber - b.stintNumber;
    });
};
