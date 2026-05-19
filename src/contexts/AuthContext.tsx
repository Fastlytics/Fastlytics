/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  use,
  useEffect,
  useReducer,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import { linkSessionToUser } from '@/lib/session';
import { Session, User } from '@supabase/supabase-js';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';
import { hasAnalyticsConsent } from '@/lib/consent';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  website: string | null;
  favorite_driver: string | null;
  favorite_team: string | null;
  onboarding_completed: boolean;
}

interface Subscription {
  plan: 'free' | 'pro' | 'ultra';
  status: 'active' | 'cancelled' | 'expired' | 'on_hold';
  billing_interval?: 'monthly' | 'yearly';
  current_period_end?: string;
}

const TIER_LEVEL: Record<string, number> = { free: 0, pro: 1, ultra: 2 };

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<Subscription | null>;
  isSubscribed: (tier?: 'pro' | 'ultra') => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshSubscription: async () => null,
  isSubscribed: () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_AUTH_SESSION'; session: Session | null; loading?: boolean }
  | { type: 'SET_PROFILE'; profile: Profile | null }
  | { type: 'SET_SUBSCRIPTION'; subscription: Subscription | null }
  | { type: 'SET_LOADING'; loading: boolean };

const initialAuthState: AuthState = {
  session: null,
  user: null,
  profile: null,
  subscription: null,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_AUTH_SESSION': {
      const nextUser = action.session?.user ?? null;
      const nextLoading = action.loading ?? state.loading;

      if (!nextUser) {
        return {
          ...state,
          session: action.session,
          user: null,
          profile: null,
          subscription: null,
          loading: nextLoading,
        };
      }

      return {
        ...state,
        session: action.session,
        user: nextUser,
        loading: nextLoading,
      };
    }
    case 'SET_PROFILE':
      return { ...state, profile: action.profile };
    case 'SET_SUBSCRIPTION':
      return { ...state, subscription: action.subscription };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const isFetchingProfile = useRef(false);
  const hasResolvedInitialSession = useRef(false);

  const fetchSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, billing_interval, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        logger.error('Error fetching subscription:', error);
        dispatch({ type: 'SET_SUBSCRIPTION', subscription: null });
        return null;
      } else if (data) {
        dispatch({ type: 'SET_SUBSCRIPTION', subscription: data as Subscription });
        return data as Subscription;
      } else {
        const freeSubscription = { plan: 'free', status: 'active' } as Subscription;
        dispatch({ type: 'SET_SUBSCRIPTION', subscription: freeSubscription });
        return freeSubscription;
      }
    } catch (error) {
      logger.error('Unexpected error fetching subscription:', error);
      dispatch({ type: 'SET_SUBSCRIPTION', subscription: null });
      return null;
    }
  }, []);

  const fetchProfile = useCallback(
    async (
      userId: string,
      userEmail?: string,
      userMeta?: { full_name?: string; avatar_url?: string }
    ) => {
      if (isFetchingProfile.current) {
        return;
      }

      isFetchingProfile.current = true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Row not found
            // Create new profile
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: userId,
                  full_name: userMeta?.full_name || userEmail?.split('@')[0] || 'User',
                  avatar_url: userMeta?.avatar_url,
                  onboarding_completed: false,
                },
              ])
              .select()
              .single();

            if (createError) {
              logger.error('Error creating profile:', createError);
            } else {
              dispatch({ type: 'SET_PROFILE', profile: newProfile });
            }
          } else {
            logger.error('Error fetching profile:', error);
          }
        } else {
          dispatch({ type: 'SET_PROFILE', profile: data });
        }
      } catch (error) {
        logger.error('Unexpected error fetching profile:', error);
        dispatch({ type: 'SET_PROFILE', profile: null });
      } finally {
        isFetchingProfile.current = false;
      }
    },
    []
  );

  useEffect(() => {
    // Set up auth state listener FIRST - this is the recommended approach by Supabase
    // The listener will fire with the initial session when Supabase finishes initializing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state changed:', event);
      hasResolvedInitialSession.current = true;

      dispatch({ type: 'SET_AUTH_SESSION', session, loading: false });

      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase's internal state
        setTimeout(() => {
          fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
          fetchSubscription(session.user.id);
        }, 0);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Stitch anonymous session trail to the authenticated user
        linkSessionToUser(session.user.id);
        Sentry.setUser({ id: session.user.id, email: session.user.email });
        if (hasAnalyticsConsent()) {
          posthog.identify(session.user.id, {
            email: session.user.email,
          });
          posthog.capture('login_completed');
        }
      } else if (event === 'SIGNED_OUT') {
        Sentry.setUser(null);
        if (hasAnalyticsConsent()) {
          posthog.capture('logout');
        }
        posthog.reset();
      }
    });

    // Also call getSession for the initial state (but don't block on it)
    // This handles cases where onAuthStateChange might not fire immediately
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        // Only update if we haven't received an auth state change yet
        if (!hasResolvedInitialSession.current) {
          hasResolvedInitialSession.current = true;
          dispatch({ type: 'SET_AUTH_SESSION', session, loading: false });

          if (session?.user) {
            fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            fetchSubscription(session.user.id);
          }
        }
      })
      .catch((error) => {
        logger.error('Error getting session:', error);
        dispatch({ type: 'SET_LOADING', loading: false });
      });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_AUTH_SESSION', session: null, loading: false });
  };

  const refreshProfile = async () => {
    if (state.user) {
      await fetchProfile(state.user.id, state.user.email, state.user.user_metadata);
    }
  };

  const refreshSubscription = async () => {
    if (!state.user) {
      dispatch({ type: 'SET_SUBSCRIPTION', subscription: null });
      return null;
    }

    return fetchSubscription(state.user.id);
  };

  const isSubscribed = useCallback(
    (tier: 'pro' | 'ultra' = 'pro') => {
      if (!state.subscription || state.subscription.status !== 'active') return false;
      return TIER_LEVEL[state.subscription.plan] >= TIER_LEVEL[tier];
    },
    [state.subscription]
  );

  const value = {
    session: state.session,
    user: state.user,
    profile: state.profile,
    subscription: state.subscription,
    loading: state.loading,
    signOut,
    refreshProfile,
    refreshSubscription,
    isSubscribed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  return use(AuthContext);
};
