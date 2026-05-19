import type { DriverStanding, TeamStanding } from '@/lib/api';

export type UserIntent = 'casual' | 'data' | 'fantasy' | 'media';

export type OnboardingState = {
  step: number;
  isLoading: boolean;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  firstName: string;
  lastName: string;
  username: string;
  selectedIntent: UserIntent | null;
  selectedDriver: string | null;
  selectedTeam: string | null;
  notifyRaceStart: boolean;
  notifyQualifying: boolean;
  notifyResults: boolean;
};

type OnboardingAction =
  | { type: 'nextStep' }
  | { type: 'previousStep' }
  | { type: 'goToStep'; step: number }
  | { type: 'setIsLoading'; value: boolean }
  | { type: 'setFirstName'; value: string }
  | { type: 'setLastName'; value: string }
  | { type: 'setUsername'; value: string }
  | { type: 'setIntent'; value: UserIntent }
  | { type: 'setDriverSelection'; value: string }
  | { type: 'setTeamSelection'; value: string }
  | { type: 'toggleNotifyRaceStart' }
  | { type: 'toggleNotifyQualifying' }
  | { type: 'toggleNotifyResults' }
  | { type: 'setF1Data'; drivers: DriverStanding[]; teams: TeamStanding[] };

export const TOTAL_STEPS = 7;

export const initialOnboardingState: OnboardingState = {
  step: 1,
  isLoading: false,
  drivers: [],
  teams: [],
  firstName: '',
  lastName: '',
  username: '',
  selectedIntent: null,
  selectedDriver: null,
  selectedTeam: null,
  notifyRaceStart: true,
  notifyQualifying: false,
  notifyResults: true,
};

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'nextStep':
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case 'previousStep':
      return { ...state, step: Math.max(state.step - 1, 1) };
    case 'goToStep':
      return { ...state, step: action.step };
    case 'setIsLoading':
      return { ...state, isLoading: action.value };
    case 'setFirstName':
      return { ...state, firstName: action.value };
    case 'setLastName':
      return { ...state, lastName: action.value };
    case 'setUsername':
      return { ...state, username: action.value };
    case 'setIntent':
      return { ...state, selectedIntent: action.value };
    case 'setDriverSelection':
      return { ...state, selectedDriver: action.value };
    case 'setTeamSelection':
      return { ...state, selectedTeam: action.value };
    case 'toggleNotifyRaceStart':
      return { ...state, notifyRaceStart: !state.notifyRaceStart };
    case 'toggleNotifyQualifying':
      return { ...state, notifyQualifying: !state.notifyQualifying };
    case 'toggleNotifyResults':
      return { ...state, notifyResults: !state.notifyResults };
    case 'setF1Data':
      return { ...state, drivers: action.drivers, teams: action.teams };
    default:
      return state;
  }
}
