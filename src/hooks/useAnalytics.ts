import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(
    async (eventName: string, data?: Record<string, unknown>) => {
      // 1. Track in Umami (if available)
      if (window.umami) {
        try {
          window.umami.track(eventName, data);
        } catch (error) {
          console.warn('Umami tracking failed:', error);
        }
      }

      // 2. Track in Supabase (if user is logged in)
      if (user) {
        try {
          const { error } = await supabase.from('user_activity').insert({
            user_id: user.id,
            event_name: eventName,
            event_data: data,
          });

          if (error) {
            console.error('Supabase analytics tracking failed:', error);
          }
        } catch (error) {
          console.error('Unexpected error tracking in Supabase:', error);
        }
      }
    },
    [user]
  );

  return { trackEvent };
};
