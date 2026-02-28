import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getSessionId } from '@/lib/session';
import { fetchTrackingData, TrackingData } from '@/lib/tracking';
import posthog from 'posthog-js';

/** Get the user's local hour bucket (0-23) and day-of-week for access pattern analysis */
const getAccessTimeMeta = () => {
  const now = new Date();
  return {
    local_hour: now.getHours(),
    local_day: now.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue, etc.
    local_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    local_date: now.toISOString().slice(0, 10), // 2026-02-28
  };
};

export const useAnalytics = () => {
  const { user } = useAuth();
  const pageEntryTime = useRef<number>(0);
  const sessionId = useRef<string>(getSessionId());
  const [trackingData, setTrackingData] = useState<Partial<TrackingData>>({});

  // Fetch advanced tracking data on mount
  useEffect(() => {
    fetchTrackingData().then((data) => setTrackingData(data));
  }, []);

  // Track time-on-page when component unmounts
  useEffect(() => {
    pageEntryTime.current = Date.now();
    return () => {
      const timeSpent = Math.round((Date.now() - pageEntryTime.current) / 1000);
      if (timeSpent > 1) {
        posthog.capture('time_on_page', {
          seconds: timeSpent,
          page: window.location.pathname,
          ...getAccessTimeMeta(),
        });
      }
    };
  }, []);

  const trackEvent = useCallback(
    async (eventName: string, data?: Record<string, unknown>) => {
      const enrichedData = {
        ...data,
        ...trackingData, // Includes IP, Geolocation, Device Fingerprint, ISP
        page_path: window.location.pathname,
        page_url: window.location.href,
        referrer: document.referrer || undefined,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        timestamp: new Date().toISOString(),
        is_mobile: window.innerWidth < 768,
        session_id: sessionId.current,
        ...getAccessTimeMeta(),
      };

      // 1. Track in PostHog (always available, handles anonymous users)
      try {
        posthog.capture(eventName, enrichedData);
      } catch (error) {
        logger.warn('PostHog tracking failed:', error);
      }

      // 2. Track in Umami (if available) — send enriched data for parity
      if (window.umami) {
        try {
          window.umami.track(eventName, enrichedData);
        } catch (error) {
          logger.warn('Umami tracking failed:', error);
        }
      }

      // 3. Track in Supabase (ALL users — anonymous and authenticated)
      try {
        const { error } = await supabase.from('user_activity').insert({
          user_id: user?.id ?? null,
          session_id: sessionId.current,
          event_name: eventName,
          event_data: enrichedData,
        });

        if (error) {
          logger.error('Supabase analytics tracking failed:', error);
        }
      } catch (error) {
        logger.error('Unexpected error tracking in Supabase:', error);
      }
    },
    [user, trackingData]
  );

  /** Track a page view with optional metadata */
  const trackPageView = useCallback(
    (pageName: string, data?: Record<string, unknown>) => {
      trackEvent('page_viewed', { page_name: pageName, ...data });
    },
    [trackEvent]
  );

  /** Track a dropdown / selector change */
  const trackSelection = useCallback(
    (selectorName: string, value: string | number, data?: Record<string, unknown>) => {
      trackEvent('selection_changed', { selector: selectorName, selected_value: value, ...data });
    },
    [trackEvent]
  );

  /** Track a toggle or filter action */
  const trackInteraction = useCallback(
    (interactionName: string, data?: Record<string, unknown>) => {
      trackEvent('user_interaction', { interaction: interactionName, ...data });
    },
    [trackEvent]
  );

  return { trackEvent, trackPageView, trackSelection, trackInteraction };
};
