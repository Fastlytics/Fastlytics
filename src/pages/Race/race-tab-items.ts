import type React from 'react';
import {
  ChampionIcon,
  PlayCircle02Icon,
  TireIcon,
  ChartLineData01Icon,
  GitCompareIcon,
  Analytics01Icon,
} from 'hugeicons-react';

/**
 * Context passed to each tab item's optional `showWhen` predicate. Mirrors
 * the subset of {@link import('./race-layout-context').RaceLayoutContext}
 * needed to decide whether a section is available for the current session.
 */
export interface SectionVisibilityContext {
  selectedSession: string;
  isTestingSession: boolean;
  isTestingEvent: boolean;
}

/**
 * Declarative description of one entry in the race page tab strip.
 *
 * The same list is consumed by `RaceTabStrip` (to decide which tabs to
 * render) and by each section's `SectionUnavailable` guard (to decide
 * whether to render content or an inline "switch session" card), so the
 * two surfaces can never drift.
 */
export interface RaceTabItem {
  label: string;
  segment: string;
  icon: React.ElementType;
  /**
   * Optional predicate — if present and returns `false` for the current
   * context, the tab is hidden and the section renders an unavailable card.
   * A tab without `showWhen` is always visible.
   */
  showWhen?: (ctx: SectionVisibilityContext) => boolean;
}

/**
 * Ordered tab configuration for the race page. Order matches the visual
 * order in `RaceTabStrip`. Team Pace is intentionally absent — the race
 * page redirects `/race/:raceId/team-pace` to the global `/team-pace` page.
 */
export const RACE_TAB_ITEMS: RaceTabItem[] = [
  { label: 'Overview', segment: 'overview', icon: ChampionIcon },
  { label: 'Replay', segment: 'replay', icon: PlayCircle02Icon },
  {
    label: 'Strategy',
    segment: 'strategy',
    icon: TireIcon,
    showWhen: ({ selectedSession, isTestingSession }) =>
      selectedSession === 'R' || selectedSession === 'Sprint' || isTestingSession === true,
  },
  { label: 'Lap Analysis', segment: 'lap-analysis', icon: ChartLineData01Icon },
  { label: 'Head to Head', segment: 'head-to-head', icon: GitCompareIcon },
  { label: 'Telemetry', segment: 'telemetry', icon: Analytics01Icon },
];

/**
 * Pure predicate used by both the tab strip and each section. Returns
 * `true` when the item has no `showWhen`; otherwise delegates to it.
 */
export function sectionVisibleFor(item: RaceTabItem, ctx: SectionVisibilityContext): boolean {
  if (item.showWhen === undefined) {
    return true;
  }
  return item.showWhen(ctx);
}
