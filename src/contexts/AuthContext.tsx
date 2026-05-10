/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  use,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import { linkSessionToUser } from '@/lib/session';
import { Session, User } from '@supabase/supabase-js';
import posthog from 'posthog-js';
import { logger } from '@/lib/logger';
import { hasAnalyticsConsent } from '@/lib/consent';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const isFetchingProfile = useRef(false);

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
        setSubscription(null);
        return null;
      } else if (data) {
        setSubscription(data as Subscription);
        return data as Subscription;
      } else {
        const freeSubscription = { plan: 'free', status: 'active' } as Subscription;
        setSubscription(freeSubscription);
        return freeSubscription;
      }
    } catch (error) {
      logger.error('Unexpected error fetching subscription:', error);
      setSubscription(null);
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
              setProfile(newProfile);
            }
          } else {
            logger.error('Error fetching profile:', error);
          }
        } else {
          setProfile(data);
        }
      } catch (error) {
        logger.error('Unexpected error fetching profile:', error);
        setProfile(null);
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

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase's internal state
        setTimeout(() => {
          fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
          fetchSubscription(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setSubscription(null);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Stitch anonymous session trail to the authenticated user
        linkSessionToUser(session.user.id);
        if (hasAnalyticsConsent()) {
          posthog.identify(session.user.id, {
            email: session.user.email,
          });
          posthog.capture('login_completed');
        }
      } else if (event === 'SIGNED_OUT') {
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
        if (loading) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          if (session?.user) {
            fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            fetchSubscription(session.user.id);
          }
        }
      })
      .catch((error) => {
        logger.error('Error getting session:', error);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      return null;
    }

    return fetchSubscription(user.id);
  };

  const isSubscribed = useCallback(
    (tier: 'pro' | 'ultra' = 'pro') => {
      if (!subscription || subscription.status !== 'active') return false;
      return TIER_LEVEL[subscription.plan] >= TIER_LEVEL[tier];
    },
    [subscription]
  );

  const value = {
    session,
    user,
    profile,
    subscription,
    loading,
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
