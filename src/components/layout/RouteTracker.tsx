import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import { logger } from '@/lib/logger';

/**
 * Tracks route changes and captures navigation analytics.
 * Captures: page path, referrer (previous page), time spent on previous page,
 * query params, and navigation pattern.
 */
const RouteTracker = () => {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);
  const pageEntryTime = useRef<number>(0);

  useEffect(() => {
    const currentPath = location.pathname;
    const timeOnPrevPage = prevPath.current
      ? Math.round((Date.now() - pageEntryTime.current) / 1000)
      : 0;

    try {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        path: currentPath,
        search: location.search,
        hash: location.hash,
        previous_path: prevPath.current,
        time_on_previous_page: timeOnPrevPage > 0 ? timeOnPrevPage : undefined,
        referrer: document.referrer || undefined,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        is_mobile: window.innerWidth < 768,
      });
    } catch (error) {
      logger.warn('Route tracking failed:', error);
    }

    // Track in Umami too
    if (window.umami) {
      try {
        window.umami.track('pageview', {
          path: currentPath,
          previous_path: prevPath.current,
        });
      } catch (error) {
        logger.warn('Umami route tracking failed:', error);
      }
    }

    prevPath.current = currentPath;
    pageEntryTime.current = Date.now();
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default RouteTracker;
