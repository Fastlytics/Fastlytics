import { useEffect, useRef, useCallback } from 'react';
import posthog from 'posthog-js';
import { logger } from '@/lib/logger';

interface UseChartVisibilityOptions {
  /** Unique identifier for the chart, e.g. "position_chart", "lap_time_chart" */
  chartName: string;
  /** Page context, e.g. "race", "team_pace" */
  page: string;
  /** Additional metadata to include with the event */
  meta?: Record<string, unknown>;
  /** Minimum seconds in viewport before an event fires (default: 2) */
  minSeconds?: number;
  /** Whether tracking is enabled (useful to disable while loading) */
  enabled?: boolean;
}

/**
 * Track how long a chart/section is visible in the viewport.
 *
 * Returns a `ref` to attach to the container element. When the element
 * enters the viewport an internal timer starts. When it leaves (or the
 * component unmounts) a `chart_viewed` event is fired with the total
 * visible duration.
 *
 * Uses IntersectionObserver for performance — no scroll listeners.
 *
 * @example
 * const chartRef = useChartVisibility({ chartName: 'position_chart', page: 'race' });
 * return <div ref={chartRef}><ResponsiveContainer>…</ResponsiveContainer></div>;
 */
export const useChartVisibility = <T extends HTMLElement = HTMLDivElement>({
  chartName,
  page,
  meta,
  minSeconds = 2,
  enabled = true,
}: UseChartVisibilityOptions) => {
  const ref = useRef<T | null>(null);
  const entryTime = useRef<number | null>(null);
  const totalVisible = useRef(0);
  const hasFired = useRef(false);

  const flush = useCallback(() => {
    // Accumulate any in-progress viewing time
    if (entryTime.current !== null) {
      totalVisible.current += (Date.now() - entryTime.current) / 1000;
      entryTime.current = null;
    }

    const seconds = Math.round(totalVisible.current);
    if (seconds >= minSeconds && !hasFired.current) {
      hasFired.current = true;
      try {
        posthog.capture('chart_viewed', {
          chart_name: chartName,
          page,
          view_duration_seconds: seconds,
          ...meta,
        });
      } catch (e) {
        logger.warn('Chart visibility tracking failed:', e);
      }
    }
  }, [chartName, page, meta, minSeconds]);

  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (!el) return;

    // Reset on re-mount / prop change
    totalVisible.current = 0;
    hasFired.current = false;
    entryTime.current = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entryTime.current = Date.now();
        } else {
          // Left viewport — accumulate
          if (entryTime.current !== null) {
            totalVisible.current += (Date.now() - entryTime.current) / 1000;
            entryTime.current = null;
          }
        }
      },
      { threshold: 0.3 } // At least 30% visible
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      flush();
    };
  }, [chartName, page, enabled, flush]);

  return ref;
};

/**
 * Lightweight hook to track a section's dwell-time on unmount.
 *
 * Fires a `section_dwell` event once when the component unmounts
 * (e.g. user navigates away or switches tabs) with the total time
 * the section/page was mounted.
 */
export const useSectionDwell = (
  sectionName: string,
  page: string,
  meta?: Record<string, unknown>
) => {
  const mountTime = useRef(0);

  useEffect(() => {
    mountTime.current = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - mountTime.current) / 1000);
      if (seconds >= 1) {
        try {
          posthog.capture('section_dwell', {
            section_name: sectionName,
            page,
            dwell_seconds: seconds,
            ...meta,
          });
        } catch (e) {
          logger.warn('Section dwell tracking failed:', e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionName, page]); // Only run on mount and when sectionName/page change
};
