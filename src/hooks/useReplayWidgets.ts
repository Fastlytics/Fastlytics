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
  weather: { width: 220, height: 220 },
  racecontrol: { width: 320, height: 260 },
  sectors: { width: 260, height: 260 },
  telemetry: { width: 240, height: 340 },
  laphistory: { width: 260, height: 300 },
};

const WIDGET_ORDER: WidgetId[] = ['weather', 'racecontrol', 'sectors', 'laphistory', 'telemetry'];
const STORAGE_KEY = 'replay-widgets-layout-v3';

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

function computeDefaultLayouts(
  containerWidth: number,
  containerHeight: number,
  bounds: WidgetBounds
): Record<WidgetId, WidgetLayout> {
  const gap = 12;
  const widths = WIDGET_ORDER.map((widgetId) => DEFAULT_SIZES[widgetId].width);
  const heights = WIDGET_ORDER.map((widgetId) => DEFAULT_SIZES[widgetId].height);
  const maxHeight = Math.max(...heights);
  const totalWidth =
    widths.reduce((total, width) => total + width, 0) + gap * (WIDGET_ORDER.length - 1);
  const defaultX = Math.max(bounds.minX, (containerWidth - totalWidth) / 2);
  const defaultY = Math.max(bounds.minY, containerHeight - maxHeight - 150);

  const layouts = {} as Record<WidgetId, WidgetLayout>;
  let nextX = defaultX;

  for (const widgetId of WIDGET_ORDER) {
    layouts[widgetId] = clampLayout(
      {
        x: Math.round(nextX),
        y: Math.round(defaultY),
        width: DEFAULT_SIZES[widgetId].width,
        height: DEFAULT_SIZES[widgetId].height,
      },
      {
        x: bounds.minX,
        y: bounds.minY,
        width: DEFAULT_SIZES[widgetId].width,
        height: DEFAULT_SIZES[widgetId].height,
      },
      bounds
    );

    nextX += DEFAULT_SIZES[widgetId].width + gap;
  }

  return layouts;
}

function normalizeLayouts(
  layouts: Partial<Record<WidgetId, Partial<WidgetLayout>>>,
  containerWidth: number,
  containerHeight: number,
  bounds: WidgetBounds
): Record<WidgetId, WidgetLayout> {
  const defaults = computeDefaultLayouts(containerWidth, containerHeight, bounds);

  return WIDGET_ORDER.reduce(
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    } catch {
      // ignore persistence errors
    }
  }, [layouts]);

  const updateLayout = useCallback(
    (id: WidgetId, updates: Partial<WidgetLayout>) => {
      setLayouts((prev) => {
        const next = clampLayout({ ...prev[id], ...updates }, prev[id], bounds);
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
