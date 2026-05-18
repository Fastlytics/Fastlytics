import { getLatestAvailableSession } from './utils';

interface TeamPaceAnalysisState {
  selectedYear: number;
  requestedEventSlug: string | null;
  selectedSession: string;
  syncedEventKey: string | null;
}

type TeamPaceAnalysisAction =
  | { type: 'yearChanged'; year: number }
  | { type: 'eventChanged'; eventSlug: string }
  | { type: 'sessionChanged'; session: string }
  | { type: 'syncEvent'; eventKey: string; availableSessions: Record<string, unknown> };

export const initialTeamPaceAnalysisState: TeamPaceAnalysisState = {
  selectedYear: new Date().getFullYear(),
  requestedEventSlug: null,
  selectedSession: 'R',
  syncedEventKey: null,
};

export const createInitialState = (year: number): TeamPaceAnalysisState => ({
  selectedYear: year,
  requestedEventSlug: null,
  selectedSession: 'R',
  syncedEventKey: null,
});

export const teamPaceAnalysisReducer = (
  state: TeamPaceAnalysisState,
  action: TeamPaceAnalysisAction
): TeamPaceAnalysisState => {
  switch (action.type) {
    case 'yearChanged':
      return {
        ...state,
        selectedYear: action.year,
      };
    case 'eventChanged':
      return {
        ...state,
        requestedEventSlug: action.eventSlug,
      };
    case 'sessionChanged':
      return {
        ...state,
        selectedSession: action.session,
      };
    case 'syncEvent': {
      const sessionNames = Object.keys(action.availableSessions);
      if (!sessionNames.length) return state;

      const hasCurrentSession = sessionNames.includes(state.selectedSession);
      if (state.syncedEventKey === action.eventKey && hasCurrentSession) {
        return state;
      }

      return {
        ...state,
        selectedSession: hasCurrentSession
          ? state.selectedSession
          : getLatestAvailableSession(action.availableSessions as Record<string, []>),
        syncedEventKey: action.eventKey,
      };
    }
    default:
      return state;
  }
};

export type { TeamPaceAnalysisState };
