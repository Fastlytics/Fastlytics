import { getDriverSlug } from '@/lib/driverSlugs';

// Command palette search utilities
// Provides search index building and filtering for the global command palette (Cmd+K)

export interface SearchEntry {
  id: string;
  label: string;
  category: 'Pages' | 'Drivers' | 'Teams' | 'Races';
  path: string;
  keywords?: string[];
}

export const STATIC_PAGES: SearchEntry[] = [
  { id: 'page-dashboard', label: 'Dashboard', category: 'Pages', path: '/dashboard' },
  { id: 'page-calendar', label: 'Calendar', category: 'Pages', path: '/calendar' },
  { id: 'page-drivers', label: 'Driver Standings', category: 'Pages', path: '/standings/drivers' },
  { id: 'page-teams', label: 'Team Standings', category: 'Pages', path: '/standings/teams' },
  { id: 'page-settings', label: 'Settings', category: 'Pages', path: '/settings' },
  { id: 'page-saved', label: 'Saved', category: 'Pages', path: '/saved' },
  { id: 'page-team-pace', label: 'Team Pace Analysis', category: 'Pages', path: '/team-pace' },
  {
    id: 'page-compare-drivers',
    label: 'Compare Drivers',
    category: 'Pages',
    path: '/compare/drivers',
  },
  {
    id: 'page-compare-teams',
    label: 'Compare Teams',
    category: 'Pages',
    path: '/compare/teams',
  },
];

/**
 * Builds a complete search index from static pages and dynamic data (drivers, teams, schedule).
 * Uses minimal interfaces to avoid importing full API types.
 */
export function buildSearchIndex(
  drivers: { code: string; name: string; team?: string }[],
  teams: { team: string; shortName?: string }[],
  schedule: { RoundNumber: number; EventName: string; Country?: string; Location?: string }[],
  selectedYear: number
): SearchEntry[] {
  const entries: SearchEntry[] = [...STATIC_PAGES];

  // Add driver entries
  if (drivers && drivers.length > 0) {
    for (const driver of drivers) {
      const slug = getDriverSlug(driver.code, driver.name);
      entries.push({
        id: `driver-${driver.code}`,
        label: driver.name,
        category: 'Drivers',
        path: `/drivers/${slug}`,
        keywords: [driver.code, driver.team || ''].filter(Boolean),
      });
    }
  }

  // Add team entries
  if (teams && teams.length > 0) {
    for (const team of teams) {
      const slug = team.team.toLowerCase().replace(/\s+/g, '-');
      entries.push({
        id: `team-${slug}`,
        label: team.team,
        category: 'Teams',
        path: `/teams/${slug}`,
        keywords: [team.shortName || ''].filter(Boolean),
      });
    }
  }

  // Add race/schedule entries
  if (schedule && schedule.length > 0) {
    for (const event of schedule) {
      const eventSlug = event.EventName.toLowerCase().replace(/\s+/g, '-');
      entries.push({
        id: `race-${selectedYear}-${event.RoundNumber}`,
        label: event.EventName,
        category: 'Races',
        path: `/race/${selectedYear}-${eventSlug}`,
        keywords: [event.Country || '', event.Location || ''].filter(Boolean),
      });
    }
  }

  return entries;
}

/**
 * Filters search entries by query string.
 * - Returns empty array for empty/whitespace-only queries
 * - Case-insensitive substring match on label or any keyword
 * - Capped at 10 results total
 * - Results are grouped by category (Pages, Drivers, Teams, Races)
 */
export function filterSearchResults(query: string, entries: SearchEntry[]): SearchEntry[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const lowerQuery = trimmed.toLowerCase();

  // Find all matching entries
  const matches = entries.filter((entry) => {
    // Check label match
    if (entry.label.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    // Check keywords match
    if (entry.keywords && entry.keywords.length > 0) {
      return entry.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery));
    }
    return false;
  });

  // Group by category in defined order
  const categoryOrder: SearchEntry['category'][] = ['Pages', 'Drivers', 'Teams', 'Races'];
  const grouped: SearchEntry[] = [];

  for (const category of categoryOrder) {
    const categoryMatches = matches.filter((m) => m.category === category);
    grouped.push(...categoryMatches);
  }

  // Cap at 10 results
  return grouped.slice(0, 10);
}
