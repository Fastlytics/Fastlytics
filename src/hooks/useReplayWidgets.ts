import { useState, useEffect, useCallback, useRef } from 'react';

export interface WidgetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type WidgetId = 'weather' | 'racecontrol' | 'sectors' | 'telemetry' | 'laphistory';

export const REPLAY_WIDGET_MIN_WIDTH = 180;
export const REPLAY_WIDGET_MIN_HEIGHT = 120;

const DEFAULT_SIZES: Record<WidgetId, { width: number; height: number }> = {
  weather: { width: 210, height: 200 },
  racecontrol: { width: 300, height: 240 },
  sectors: { width: 250, height: 240 },
  telemetry: { width: 230, height: 320 },
  laphistory: { width: 250, height: 280 },
};

const STORAGE_KEY = 'replay-widgets-layout-v4';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function clampLayout(
  layout: Partial<WidgetLayout> | undefined,
  fallback: WidgetLayout,
  bounds: WidgetBounds
): WidgetLayout {
  const maxWidth = Math.max(REPLAY_WIDGET_MIN_WIDTH, bounds.maxX - bounds.minX);
  const maxHeight = Math.max(REPLAY_WIDGET_MIN_HEIGHT, bounds.maxY - bounds.minY);
  const width = clamp(layout?.width ?? fallback.width, REPLAY_WIDGET_MIN_WIDTH, maxWidth);
  const height = clamp(layout?.height ?? fallback.height, REPLAY_WIDGET_MIN_HEIGHT, maxHeight);

  return {
    x: clamp(layout?.x ?? fallback.x, bounds.minX, bounds.maxX - width),
    y: clamp(layout?.y ?? fallback.y, bounds.minY, bounds.maxY - height),
    width,
    height,
  };
}

/**
 * Computes a structured default layout:
 * - Left column: Telemetry (top-left), Weather (below telemetry)
 * - Bottom-left area: Race Control (below weather, wider)
 * - Right side (above leaderboard): Sectors (top), Lap History (below)
 *
 * This prevents overlap and gives a predictable "pit wall" feel.
 */
function computeDefaultLayouts(
  containerWidth: number,
  containerHeight: number,
  bounds: WidgetBounds
): Record<WidgetId, WidgetLayout> {
  const gap = 10;
  const topOffset = 80; // Clear the title bar area
  const bottomOffset = 80; // Clear the playback controls
  const leftMargin = bounds.minX + 160; // Clear the toolbar buttons
  const availableHeight = containerHeight - topOffset - bottomOffset;

  // Left column: Telemetry stacked above Weather
  const telemetryX = leftMargin;
  const telemetryY = topOffset;
  const telemetryH = Math.min(DEFAULT_SIZES.telemetry.height, availableHeight * 0.55);

  const weatherX = leftMargin;
  const weatherY = telemetryY + telemetryH + gap;
  const weatherH = Math.min(DEFAULT_SIZES.weather.height, availableHeight - telemetryH - gap);

  // Second column: Race Control (wider, next to left column)
  const col2X = leftMargin + DEFAULT_SIZES.telemetry.width + gap;
  const raceControlY = topOffset;
  const raceControlH = Math.min(DEFAULT_SIZES.racecontrol.height, availableHeight * 0.45);

  // Bottom of second column: Sectors
  const sectorsX = col2X;
  const sectorsY = raceControlY + raceControlH + gap;
  const sectorsH = Math.min(DEFAULT_SIZES.sectors.height, availableHeight - raceControlH - gap);

  // Right side (before leaderboard): Lap History
  const lapHistoryW = DEFAULT_SIZES.laphistory.width;
  const lapHistoryX = Math.max(
    col2X + DEFAULT_SIZES.racecontrol.width + gap,
    bounds.maxX - lapHistoryW - gap
  );
  const lapHistoryY = topOffset;
  const lapHistoryH = Math.min(DEFAULT_SIZES.laphistory.height, availableHeight * 0.5);

  const layouts: Record<WidgetId, WidgetLayout> = {
    telemetry: clampLayout(
      { x: telemetryX, y: telemetryY, width: DEFAULT_SIZES.telemetry.width, height: telemetryH },
      { x: bounds.minX, y: bounds.minY, ...DEFAULT_SIZES.telemetry },
      bounds
    ),
    weather: clampLayout(
      { x: weatherX, y: weatherY, width: DEFAULT_SIZES.weather.width, height: weatherH },
      { x: bounds.minX, y: bounds.minY, ...DEFAULT_SIZES.weather },
      bounds
    ),
    racecontrol: clampLayout(
      {
        x: col2X,
        y: raceControlY,
        width: DEFAULT_SIZES.racecontrol.width,
        height: raceControlH,
      },
      { x: bounds.minX, y: bounds.minY, ...DEFAULT_SIZES.racecontrol },
      bounds
    ),
    sectors: clampLayout(
      { x: sectorsX, y: sectorsY, width: DEFAULT_SIZES.sectors.width, height: sectorsH },
      { x: bounds.minX, y: bounds.minY, ...DEFAULT_SIZES.sectors },
      bounds
    ),
    laphistory: clampLayout(
      { x: lapHistoryX, y: lapHistoryY, width: lapHistoryW, height: lapHistoryH },
      { x: bounds.minX, y: bounds.minY, ...DEFAULT_SIZES.laphistory },
      bounds
    ),
  };

  return layouts;
}

function normalizeLayouts(
  layouts: Partial<Record<WidgetId, Partial<WidgetLayout>>>,
  containerWidth: number,
  containerHeight: number,
  bounds: WidgetBounds
): Record<WidgetId, WidgetLayout> {
  const defaults = computeDefaultLayouts(containerWidth, containerHeight, bounds);
  const ids: WidgetId[] = ['weather', 'racecontrol', 'sectors', 'telemetry', 'laphistory'];

  return ids.reduce(
    (acc, widgetId) => {
      acc[widgetId] = clampLayout(layouts[widgetId], defaults[widgetId], bounds);
      return acc;
    },
    {} as Record<WidgetId, WidgetLayout>
  );
}

function getInitialWidgetState(
  containerWidth: number,
  containerHeight: number,
  bounds: WidgetBounds
): {
  layouts: Record<WidgetId, WidgetLayout>;
  loadedFromStorage: boolean;
} {
  const fallbackWidth = containerWidth || 1200;
  const fallbackHeight = containerHeight || 800;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Record<WidgetId, Partial<WidgetLayout>>>;
      return {
        layouts: normalizeLayouts(parsed, fallbackWidth, fallbackHeight, bounds),
        loadedFromStorage: true,
      };
    }
  } catch {
    // ignore invalid saved layouts and fall back to defaults
  }

  return {
    layouts: computeDefaultLayouts(fallbackWidth, fallbackHeight, bounds),
    loadedFromStorage: false,
  };
}

export function useReplayWidgets(
  containerWidth: number,
  containerHeight: number,
  bounds: WidgetBounds
) {
  const [initialState] = useState(() =>
    getInitialWidgetState(containerWidth, containerHeight, bounds)
  );
  const [layouts, setLayouts] = useState<Record<WidgetId, WidgetLayout>>(initialState.layouts);

  const loadedFromStorageRef = useRef(initialState.loadedFromStorage);
  const hasMeasuredContainerRef = useRef(false);

  useEffect(() => {
    if (containerWidth === 0 || containerHeight === 0) return;

    setLayouts((prev) => {
      if (!loadedFromStorageRef.current && !hasMeasuredContainerRef.current) {
        hasMeasuredContainerRef.current = true;
        return computeDefaultLayouts(containerWidth, containerHeight, bounds);
      }

      hasMeasuredContainerRef.current = true;
      return normalizeLayouts(prev, containerWidth, containerHeight, bounds);
    });
  }, [bounds, containerHeight, containerWidth]);

  // Debounce localStorage writes so dragging doesn't block the main thread
  const saveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
      } catch {
        // ignore persistence errors
      }
    }, 500);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [layouts]);

  const updateLayout = useCallback(
    (id: WidgetId, updates: Partial<WidgetLayout>) => {
      setLayouts((prev) => {
        const next = clampLayout({ ...prev[id], ...updates }, prev[id], bounds);
        // Skip update if nothing changed (prevents re-renders from stale identical updates)
        const existing = prev[id];
        if (
          next.x === existing.x &&
          next.y === existing.y &&
          next.width === existing.width &&
          next.height === existing.height
        ) {
          return prev;
        }
        return {
          ...prev,
          [id]: next,
        };
      });
    },
    [bounds]
  );

  return { layouts, updateLayout };
}
