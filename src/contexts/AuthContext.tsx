/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
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

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isFetchingProfile = useRef(false);

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
        }, 0);
      } else {
        setProfile(null);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Stitch anonymous session trail to the authenticated user
        linkSessionToUser(session.user.id);
        posthog.identify(session.user.id, {
          email: session.user.email,
        });
        posthog.capture('login_completed');
      } else if (event === 'SIGNED_OUT') {
        posthog.capture('logout');
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
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
