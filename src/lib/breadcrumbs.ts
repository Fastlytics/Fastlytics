export interface BreadcrumbSegment {
  label: string;
  path?: string; // undefined = current page (non-clickable)
}

export const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/standings/drivers': 'Driver Standings',
  '/standings/teams': 'Team Standings',
  '/standings/progression': 'Championship Progression',
  '/settings': 'Settings',
  '/saved': 'Saved',
  '/team-pace': 'Team Pace Analysis',
  '/compare/drivers': 'Compare Drivers',
  '/compare/teams': 'Compare Teams',
};

/**
 * Human-readable labels for race sub-route sections.
 *
 * Used by {@link resolveBreadcrumbs} to render the trailing breadcrumb
 * segment on pathnames of the form `/race/:raceId/<section>`.
 */
export const RACE_SECTION_LABEL: Record<string, string> = {
  overview: 'Overview',
  replay: 'Replay',
  strategy: 'Strategy',
  'lap-analysis': 'Lap Analysis',
  'head-to-head': 'Head to Head',
  telemetry: 'Telemetry',
};

/**
 * Formats a URL slug into a human-readable label.
 * e.g. "2025-bahrain-grand-prix" → "Bahrain Grand Prix"
 * Strips leading year patterns (e.g. "2025-") and capitalizes each word.
 */
export function formatSlugToLabel(slug: string): string {
  // Remove leading year prefix (e.g. "2025-")
  const withoutYear = slug.replace(/^\d{4}-/, '');

  // Split on hyphens or underscores, capitalize each word, join with spaces
  return withoutYear
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Resolves breadcrumb segments for a given pathname.
 *
 * Rules:
 * - If current page is root Dashboard ("/dashboard"), return only non-clickable "Dashboard"
 * - First ancestor segment is always "Dashboard" with path "/dashboard"
 * - Last segment has no path (non-clickable, current page)
 * - Dynamic route params are formatted to human-readable labels
 */
export function resolveBreadcrumbs(
  pathname: string,
  params?: Record<string, string>,
  pageData?: { title?: string }
): BreadcrumbSegment[] {
  // Root dashboard — single non-clickable segment
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return [{ label: 'Dashboard' }];
  }

  // Check if the full pathname has a direct mapping
  const directLabel = BREADCRUMB_MAP[pathname];
  if (directLabel) {
    return [{ label: 'Dashboard', path: '/dashboard' }, { label: directLabel }];
  }

  // Race sub-routes: `/race/:raceId/<section>` where <section> is a configured
  // race section. Returns exactly three segments:
  //   Dashboard → <race name> → <section label>
  // The race-name segment links back to `/race/:raceId/overview`; the section
  // segment is the current page and has no path.
  const raceSubRouteMatch = pathname.match(/^\/race\/([^/]+)\/([^/]+)\/?$/);
  if (raceSubRouteMatch) {
    const [, raceId, section] = raceSubRouteMatch;
    const sectionLabel = RACE_SECTION_LABEL[section];
    if (sectionLabel) {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        {
          label: pageData?.title ?? formatSlugToLabel(raceId),
          path: `/race/${raceId}/overview`,
        },
        { label: sectionLabel },
      ];
    }
  }

  // Known route prefixes that have dynamic children (e.g. /race/:raceId)
  const KNOWN_PREFIXES = [
    '/race',
    '/drivers',
    '/teams',
    '/standings',
    '/compare',
    '/replay',
    '/calendar',
    '/settings',
    '/saved',
    '/profile',
    '/team-pace',
    '/dashboard',
  ];

  const parts = pathname.split('/').filter(Boolean);

  // If the pathname doesn't start with any known prefix, fall back to single Dashboard breadcrumb
  const isKnownRoute = KNOWN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (!isKnownRoute) {
    return [{ label: 'Dashboard' }];
  }

  // Handle dynamic routes by building segments from path parts
  const segments: BreadcrumbSegment[] = [{ label: 'Dashboard', path: '/dashboard' }];

  // Build intermediate and final segments
  let currentPath = '';
  for (let i = 0; i < parts.length; i++) {
    currentPath += '/' + parts[i];
    const isLast = i === parts.length - 1;

    // Check if this accumulated path has a known label
    const knownLabel = BREADCRUMB_MAP[currentPath];

    if (knownLabel) {
      if (isLast) {
        segments.push({ label: knownLabel });
      } else {
        segments.push({ label: knownLabel, path: currentPath });
      }
    } else {
      // Dynamic segment — resolve label from pageData or format the slug
      const part = parts[i];
      let label: string;

      if (isLast && pageData?.title) {
        label = pageData.title;
      } else if (params && Object.values(params).includes(part)) {
        label = formatSlugToLabel(part);
      } else {
        label = formatSlugToLabel(part);
      }

      if (isLast) {
        segments.push({ label });
      } else {
        segments.push({ label, path: currentPath });
      }
    }
  }

  return segments;
}
