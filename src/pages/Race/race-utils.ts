export const parseRaceLapTime = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity;
  try {
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
    } else if (parts.length === 2) {
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 1000;
    }
  } catch (e) {
    console.error(`Error parsing lap time: ${timeStr}`, e);
  }
  return Infinity;
};
const parseLapTime = parseRaceLapTime;

export const TESTING_SESSION_ALIAS_PATTERN = /^DAY([1-3])_(AM|PM)$/i;

export const parseRaceTestingSessionAlias = (
  sessionType: string
): { day: number; window: 'morning' | 'afternoon' } | null => {
  const match = sessionType.match(TESTING_SESSION_ALIAS_PATTERN);
  if (!match) return null;
  return {
    day: Number(match[1]),
    window: match[2].toUpperCase() === 'AM' ? 'morning' : 'afternoon',
  };
};
const parseTestingSessionAlias = parseRaceTestingSessionAlias;

export const resolveRaceSessionForAnalysis = (sessionType: string): string => {
  const parsed = parseTestingSessionAlias(sessionType);
  if (!parsed) return sessionType;
  return `FP${parsed.day}`;
};
const resolveSessionForAnalysis = resolveRaceSessionForAnalysis;
