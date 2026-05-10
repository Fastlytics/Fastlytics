import type { DriverStanding, TeamStanding } from '@/lib/api';

export type OnboardingState = {
  step: number;
  isLoading: boolean;
  drivers: DriverStanding[];
  teams: TeamStanding[];
  selectedDriver: string | null;
  selectedTeam: string | null;
};

type OnboardingAction =
  | { type: 'nextStep' }
  | { type: 'previousStep' }
  | { type: 'setIsLoading'; value: boolean }
  | { type: 'setDriverSelection'; value: string }
  | { type: 'setTeamSelection'; value: string }
  | { type: 'setF1Data'; drivers: DriverStanding[]; teams: TeamStanding[] };

export const initialOnboardingState: OnboardingState = {
  step: 1,
  isLoading: false,
  drivers: [],
  teams: [],
  selectedDriver: null,
  selectedTeam: null,
};

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'nextStep':
      return { ...state, step: state.step + 1 };
    case 'previousStep':
      return { ...state, step: state.step - 1 };
    case 'setIsLoading':
      return { ...state, isLoading: action.value };
    case 'setDriverSelection':
      return { ...state, selectedDriver: action.value };
    case 'setTeamSelection':
      return { ...state, selectedTeam: action.value };
    case 'setF1Data':
      return { ...state, drivers: action.drivers, teams: action.teams };
    default:
      return state;
  }
}
