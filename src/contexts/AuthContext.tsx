import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import posthog from 'posthog-js';

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
  signOut: async () => { },
  refreshProfile: async () => { },
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
  const isInitialized = useRef(false);

  const fetchProfile = async (userId: string, userEmail?: string, userMeta?: any) => {
    if (isFetchingProfile.current) {
      return;
    }

    isFetchingProfile.current = true;

    try {
      // Create a promise that rejects after 10 seconds (increased from 5s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timed out')), 10000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        if (error.code === 'PGRST116') { // Row not found
          // Create new profile
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                full_name: userMeta?.full_name || userEmail?.split('@')[0] || 'User',
                avatar_url: userMeta?.avatar_url,
                onboarding_completed: false
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      // On timeout, don't block the user - they can still use the app
      console.warn('Profile fetch timeout - continuing without profile:', error);
      // Set a minimal profile to allow the app to function
      setProfile(null);
    } finally {
      isFetchingProfile.current = false;
    }
  };

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    // Get initial session
    const initSession = async () => {
      try {
        // Check if there's an auth code in the URL (OAuth callback)
        const hasAuthParams = window.location.hash.includes('access_token') || 
                             window.location.search.includes('code=');
        
        // Use longer timeout for OAuth callbacks, shorter for regular session checks
        const timeoutMs = hasAuthParams ? 15000 : 8000;
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getSession timed out')), timeoutMs);
        });

        const sessionPromise = supabase.auth.getSession();

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Don't await profile fetch - let it happen in background
          fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        }
      } catch (e) {
        // On timeout, assume no session and let user continue
        console.warn('initSession timeout - continuing without session:', e);
        setSession(null);
        setUser(null);
        
        // Clean up any stale auth params from URL to prevent repeated failures
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } finally {
        setLoading(false);
      }
    };
    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setProfile(null);
      }

      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        });
        posthog.capture('login_completed');
      } else if (event === 'SIGNED_OUT') {
        posthog.capture('logout');
        posthog.reset();
      }
    });

    return () => subscription.unsubscribe();
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
