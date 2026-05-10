export const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC107',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#4CAF50',
  WET: '#2196F3',
};

export interface FastestLapStat {
  driver: string;
  fastestTime: number | null;
  lapNumber: number;
}

export const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || Number.isNaN(totalSeconds)) {
    return 'N/A';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${formattedSeconds}`;
};
