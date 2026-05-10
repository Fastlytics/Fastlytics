import type { DriverStanding, TeamStanding } from '@/lib/api';

export type AccountSection = 'profile' | 'favorites' | 'security' | 'history' | 'subscription';

type EditableField = 'fullName' | 'username' | 'email';

export type AccountState = {
  activeSection: AccountSection;
  isLoading: boolean;
  isOpeningPortal: boolean;
  upgradeOpen: boolean;
  editingField: EditableField | null;
  profileForm: {
    fullName: string;
    username: string;
    email: string;
  };
  passwordForm: {
    oldPassword: string;
    password: string;
    confirmPassword: string;
  };
  favorites: {
    favoriteDriver: string | null;
    favoriteTeam: string | null;
  };
  f1Data: {
    drivers: DriverStanding[];
    teams: TeamStanding[];
  };
};

type AccountAction =
  | { type: 'setActiveSection'; section: AccountSection }
  | { type: 'setIsLoading'; value: boolean }
  | { type: 'setIsOpeningPortal'; value: boolean }
  | { type: 'setUpgradeOpen'; value: boolean }
  | { type: 'setEditingField'; field: EditableField | null }
  | {
      type: 'hydrateProfile';
      payload: {
        fullName: string;
        username: string;
        email: string;
        favoriteDriver: string | null;
        favoriteTeam: string | null;
      };
    }
  | { type: 'setProfileField'; field: keyof AccountState['profileForm']; value: string }
  | { type: 'resetProfileForm'; payload: AccountState['profileForm'] }
  | { type: 'setPasswordField'; field: keyof AccountState['passwordForm']; value: string }
  | { type: 'resetPasswordForm' }
  | { type: 'setFavoriteDriver'; value: string | null }
  | { type: 'setFavoriteTeam'; value: string | null }
  | { type: 'setF1Data'; drivers: DriverStanding[]; teams: TeamStanding[] };

export const getInitialAccountState = (initialSection: string | null): AccountState => ({
  activeSection: initialSection === 'subscription' ? 'subscription' : 'profile',
  isLoading: false,
  isOpeningPortal: false,
  upgradeOpen: false,
  editingField: null,
  profileForm: {
    fullName: '',
    username: '',
    email: '',
  },
  passwordForm: {
    oldPassword: '',
    password: '',
    confirmPassword: '',
  },
  favorites: {
    favoriteDriver: null,
    favoriteTeam: null,
  },
  f1Data: {
    drivers: [],
    teams: [],
  },
});

export function accountReducer(state: AccountState, action: AccountAction): AccountState {
  switch (action.type) {
    case 'setActiveSection':
      return { ...state, activeSection: action.section };
    case 'setIsLoading':
      return { ...state, isLoading: action.value };
    case 'setIsOpeningPortal':
      return { ...state, isOpeningPortal: action.value };
    case 'setUpgradeOpen':
      return { ...state, upgradeOpen: action.value };
    case 'setEditingField':
      return { ...state, editingField: action.field };
    case 'hydrateProfile':
      return {
        ...state,
        profileForm: {
          fullName: action.payload.fullName,
          username: action.payload.username,
          email: action.payload.email,
        },
        favorites: {
          favoriteDriver: action.payload.favoriteDriver,
          favoriteTeam: action.payload.favoriteTeam,
        },
      };
    case 'setProfileField':
      return {
        ...state,
        profileForm: {
          ...state.profileForm,
          [action.field]: action.value,
        },
      };
    case 'resetProfileForm':
      return {
        ...state,
        profileForm: action.payload,
      };
    case 'setPasswordField':
      return {
        ...state,
        passwordForm: {
          ...state.passwordForm,
          [action.field]: action.value,
        },
      };
    case 'resetPasswordForm':
      return {
        ...state,
        passwordForm: {
          oldPassword: '',
          password: '',
          confirmPassword: '',
        },
      };
    case 'setFavoriteDriver':
      return {
        ...state,
        favorites: {
          ...state.favorites,
          favoriteDriver: action.value,
        },
      };
    case 'setFavoriteTeam':
      return {
        ...state,
        favorites: {
          ...state.favorites,
          favoriteTeam: action.value,
        },
      };
    case 'setF1Data':
      return {
        ...state,
        f1Data: {
          drivers: action.drivers,
          teams: action.teams,
        },
      };
    default:
      return state;
  }
}
