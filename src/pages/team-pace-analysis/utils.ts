import type { TeamPaceEvent, TeamPaceSession, TeamPaceSummary } from '@/lib/api';

export const AVAILABLE_YEARS = [2026, 2025, 2024] as const;

export const SESSION_ORDER = ['FP1', 'FP2', 'FP3', 'Q', 'Sprint Shootout', 'Sprint', 'R'] as const;

export const EVOLUTION_SESSION_ORDER = ['FP1', 'FP2', 'FP3', 'Q', 'Sprint', 'R'] as const;

const TEAM_COLORS: Record<string, string> = {
  redbull: '#4781D7',
  redbullracing: '#4781D7',
  mercedes: '#6CD3BF',
  ferrari: '#F91536',
  mclaren: '#F58020',
  astonmartin: '#229971',
  alpine: '#0093CC',
  williams: '#64C4FF',
  haas: '#B6BABD',
  alfaromeo: '#C92D4B',
  kicksauber: '#52E252',
  sauber: '#52E252',
  audi: '#00E701',
  cadillac: '#C6A664',
  alphatauri: '#5E8FAA',
  vcarb: '#6692FF',
  racingbulls: '#6692FF',
  rb: '#6692FF',
  gray: '#666666',
};

export interface EvolutionDataPoint {
  name: string;
  [teamName: string]: string | number;
}

export interface ScatterDataPoint {
  teamName: string;
  teamColor: string;
  x: number;
  y: number;
  z: number;
}

export const slugifyEventName = (eventName: string) =>
  eventName.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

export const getTeamColorHex = (teamName: string) => {
  const normalized = teamName.toLowerCase().replace(/\s+/g, '');
  return TEAM_COLORS[normalized] || '#666666';
};

export const getSelectedEventSlug = (
  summaryList: TeamPaceSummary[],
  requestedEventSlug: string | null
) => {
  if (!summaryList.length) return null;
  if (
    requestedEventSlug &&
    summaryList.some((event) => slugifyEventName(event.eventName) === requestedEventSlug)
  ) {
    return requestedEventSlug;
  }
  return slugifyEventName(summaryList[0].eventName);
};

export const getEventNameFromSlug = (summaryList: TeamPaceSummary[], eventSlug: string | null) => {
  if (!eventSlug) return '';
  return (
    summaryList.find((event) => slugifyEventName(event.eventName) === eventSlug)?.eventName || ''
  );
};

export const getLatestAvailableSession = (sessions: Record<string, TeamPaceSession[]>) => {
  for (let index = SESSION_ORDER.length - 1; index >= 0; index -= 1) {
    const session = SESSION_ORDER[index];
    if (sessions[session]) {
      return session;
    }
  }
  return Object.keys(sessions)[0] || 'R';
};

export const sortSessions = (sessions: string[]) =>
  sessions.toSorted((a, b) => SESSION_ORDER.indexOf(a) - SESSION_ORDER.indexOf(b));

export const getActiveTeams = (eventData: TeamPaceEvent | null, selectedSession: string) => {
  if (!eventData) return [];
  const preferredSession = eventData.sessions[selectedSession]
    ? selectedSession
    : eventData.sessions.R
      ? 'R'
      : getLatestAvailableSession(eventData.sessions);
  return (eventData.sessions[preferredSession] || []).map((team) => team.teamName);
};

export const getEvolutionData = (eventData: TeamPaceEvent | null): EvolutionDataPoint[] => {
  if (!eventData) return [];
  return EVOLUTION_SESSION_ORDER.reduce<EvolutionDataPoint[]>((data, session) => {
    if (!eventData.sessions[session]) return data;

    const sessionPoint: EvolutionDataPoint = { name: session };
    eventData.sessions[session].forEach((team) => {
      sessionPoint[team.teamName] = team.rank;
    });
    data.push(sessionPoint);
    return data;
  }, []);
};

export const getPaceGapData = (eventData: TeamPaceEvent | null, selectedSession: string) => {
  const sessionData = eventData?.sessions[selectedSession];
  if (!sessionData?.length) return [];

  const bestTime = Math.min(...sessionData.map((team) => team.medianTime));
  return sessionData
    .map((team) => ({
      ...team,
      gapToLeader: team.medianTime - bestTime,
    }))
    .sort((a, b) => a.gapToLeader - b.gapToLeader);
};

export const getScatterData = (eventData: TeamPaceEvent | null): ScatterDataPoint[] => {
  if (!eventData) return [];

  const sessionKey = eventData.sessions.R
    ? 'R'
    : eventData.sessions.Q
      ? 'Q'
      : Object.keys(eventData.sessions)[0];

  const sessionData = sessionKey ? eventData.sessions[sessionKey] : null;
  if (!sessionData?.length) return [];

  return sessionData.map((team) => ({
    teamName: team.teamName,
    teamColor: getTeamColorHex(team.teamName),
    x: team.medianTime,
    y: team.fastestLapTime || team.medianTime,
    z: 1,
  }));
};
