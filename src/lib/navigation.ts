import {
  Home01Icon,
  Calendar01Icon,
  ChampionIcon,
  UserMultiple02Icon,
  UserGroup03Icon,
  Bookmark02Icon,
  News01Icon,
  Notification03Icon,
} from 'hugeicons-react';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  matchPaths?: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Sidebar navigation — grouped into sections.
 *
 * Sections:
 * - Main: primary app navigation
 * - Discover: browse-oriented pages
 * - You: user-owned content
 */
export const SIDEBAR_NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: Home01Icon },
      { label: 'Calendar', path: '/calendar', icon: Calendar01Icon },
      {
        label: 'Standings',
        path: '/standings/drivers',
        icon: ChampionIcon,
        matchPaths: ['/standings', '/compare'],
      },
    ],
  },
  {
    label: 'Discover',
    items: [
      { label: 'Drivers', path: '/drivers', icon: UserMultiple02Icon },
      { label: 'Teams', path: '/teams', icon: UserGroup03Icon },
    ],
  },
  {
    label: 'You',
    items: [
      { label: 'News', path: '/news', icon: News01Icon },
      { label: 'Notifications', path: '/notifications', icon: Notification03Icon },
      { label: 'Watchlist', path: '/watchlist', icon: Bookmark02Icon },
    ],
  },
];

/**
 * Flat list of all sidebar nav items — kept for backward compatibility
 * with consumers that don't care about section grouping (e.g. command palette,
 * breadcrumb resolution).
 */
export const SIDEBAR_NAV_ITEMS: NavItem[] = SIDEBAR_NAV_SECTIONS.flatMap((s) => s.items);
