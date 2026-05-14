/**
 * Smart Search — client-side intent parser for natural language queries.
 *
 * Detects patterns like:
 * - "2021 monaco gp" → race page
 * - "replay of 2024 monaco gp" → race replay section
 * - "head to head hamilton vs verstappen at 2021 france gp" → race h2h with drivers preselected
 * - "compare hamilton and verstappen" → compare drivers page
 * - "lewis hamilton" → driver profile (handled by existing search)
 *
 * Works with:
 * - Modern era (2018+): full telemetry data from FastF1
 * - Historical era (1950-2017): basic stats from Supabase
 */

export interface SmartResult {
  id: string;
  label: string;
  description: string;
  path: string;
  type: 'race' | 'replay' | 'head-to-head' | 'strategy' | 'telemetry' | 'lap-analysis' | 'compare';
  icon: 'race' | 'replay' | 'h2h' | 'strategy' | 'telemetry' | 'laps' | 'compare';
  confidence: number; // 0-1, used to rank results
  countryCode?: string; // ISO 2-letter country code for flag display
}

/** How many no-year race results to show initially */
export const SMART_RESULTS_INITIAL_LIMIT = 4;
/** How many more to load on each "load more" */
export const SMART_RESULTS_PAGE_SIZE = 4;

/**
 * Get the total number of years a race exists for (used to determine if "load more" should show).
 */
export function getSmartResultsTotalCount(query: string, raceIndex?: RaceIndexEntry[]): number {
  const trimmed = query.trim();
  if (trimmed.length < 3) return 0;
  const year = extractYear(trimmed);
  if (year) return 0; // Year specified = single result, no pagination
  const raceMatches = matchRaceNames(trimmed.split(/\s+/));
  if (raceMatches.length === 0 || !raceIndex || raceIndex.length === 0) return 0;

  let total = 0;
  for (const raceMatch of raceMatches) {
    const slugLower = raceMatch.slug.toLowerCase();
    const count = raceIndex.filter((entry) => {
      const entryWords = entry.name.toLowerCase().split(/\s+/);
      return entryWords.some((word) => word === slugLower || word.startsWith(slugLower + '-'));
    }).length;
    total += count;
  }
  return total;
}

// Section intent keywords mapped to route segments and icons
const SECTION_INTENTS: {
  keywords: string[];
  section: string;
  type: SmartResult['type'];
  icon: SmartResult['icon'];
  label: string;
}[] = [
  {
    keywords: ['replay', 'relive', 'rewatch', 'watch', 'session replay'],
    section: 'replay',
    type: 'replay',
    icon: 'replay',
    label: 'Replay',
  },
  {
    keywords: ['head to head', 'head-to-head', 'h2h', 'versus', 'vs', 'compare at', 'battle'],
    section: 'head-to-head',
    type: 'head-to-head',
    icon: 'h2h',
    label: 'Head to Head',
  },
  {
    keywords: ['strategy', 'tire', 'tyre', 'pit stop', 'pitstop', 'stint'],
    section: 'strategy',
    type: 'strategy',
    icon: 'strategy',
    label: 'Strategy',
  },
  {
    keywords: ['telemetry', 'speed trace', 'throttle', 'brake trace'],
    section: 'telemetry',
    type: 'telemetry',
    icon: 'telemetry',
    label: 'Telemetry',
  },
  {
    keywords: ['lap analysis', 'lap time', 'laptimes', 'lap chart', 'positions'],
    section: 'lap-analysis',
    type: 'lap-analysis',
    icon: 'laps',
    label: 'Lap Analysis',
  },
];

// Common race name aliases with country codes for flag display
const RACE_ALIASES: { slug: string; aliases: string[]; countryCode: string }[] = [
  { slug: 'monaco', aliases: ['monaco', 'monte carlo', 'monte-carlo'], countryCode: 'mc' },
  { slug: 'emilia-romagna', aliases: ['emilia romagna', 'imola'], countryCode: 'it' },
  { slug: 'saudi-arabian', aliases: ['saudi', 'saudi arabia', 'jeddah'], countryCode: 'sa' },
  { slug: 'las-vegas', aliases: ['las vegas', 'vegas'], countryCode: 'us' },
  {
    slug: 'united-states',
    aliases: ['united states', 'usa', 'cota', 'austin', 'us gp', 'america'],
    countryCode: 'us',
  },
  { slug: 'british', aliases: ['british', 'silverstone', 'britain'], countryCode: 'gb' },
  { slug: 'italian', aliases: ['italian', 'monza', 'italy'], countryCode: 'it' },
  {
    slug: 'belgian',
    aliases: ['belgian', 'spa', 'spa-francorchamps', 'belgium'],
    countryCode: 'be',
  },
  { slug: 'japanese', aliases: ['japanese', 'suzuka', 'japan'], countryCode: 'jp' },
  {
    slug: 'australian',
    aliases: ['australian', 'melbourne', 'albert park', 'australia'],
    countryCode: 'au',
  },
  { slug: 'canadian', aliases: ['canadian', 'montreal', 'canada'], countryCode: 'ca' },
  { slug: 'spanish', aliases: ['spanish', 'spain', 'barcelona', 'catalunya'], countryCode: 'es' },
  {
    slug: 'hungarian',
    aliases: ['hungarian', 'hungary', 'budapest', 'hungaroring'],
    countryCode: 'hu',
  },
  { slug: 'dutch', aliases: ['dutch', 'netherlands', 'zandvoort', 'holland'], countryCode: 'nl' },
  { slug: 'mexican', aliases: ['mexican', 'mexico', 'mexico city'], countryCode: 'mx' },
  {
    slug: 'brazilian',
    aliases: ['brazilian', 'brazil', 'interlagos', 'sao paulo', 'são paulo'],
    countryCode: 'br',
  },
  { slug: 'singapore', aliases: ['singapore', 'marina bay'], countryCode: 'sg' },
  { slug: 'azerbaijani', aliases: ['azerbaijan', 'baku', 'azerbaijani'], countryCode: 'az' },
  { slug: 'chinese', aliases: ['chinese', 'china', 'shanghai'], countryCode: 'cn' },
  { slug: 'bahrain', aliases: ['bahrain', 'sakhir'], countryCode: 'bh' },
  { slug: 'abu-dhabi', aliases: ['abu dhabi', 'yas marina', 'abu-dhabi'], countryCode: 'ae' },
  {
    slug: 'austrian',
    aliases: ['austrian', 'austria', 'spielberg', 'red bull ring'],
    countryCode: 'at',
  },
  {
    slug: 'french',
    aliases: ['french', 'france', 'paul ricard', 'le castellet'],
    countryCode: 'fr',
  },
  {
    slug: 'portuguese',
    aliases: ['portuguese', 'portugal', 'portimao', 'algarve'],
    countryCode: 'pt',
  },
  { slug: 'turkish', aliases: ['turkish', 'turkey', 'istanbul'], countryCode: 'tr' },
  { slug: 'russian', aliases: ['russian', 'russia', 'sochi'], countryCode: 'ru' },
  { slug: 'qatar', aliases: ['qatar', 'losail'], countryCode: 'qa' },
  { slug: 'miami', aliases: ['miami'], countryCode: 'us' },
  {
    slug: 'german',
    aliases: ['german', 'germany', 'hockenheim', 'nurburgring', 'nürburgring'],
    countryCode: 'de',
  },
  { slug: 'indian', aliases: ['indian', 'india', 'buddh'], countryCode: 'in' },
  { slug: 'korean', aliases: ['korean', 'korea', 'yeongam'], countryCode: 'kr' },
  { slug: 'malaysian', aliases: ['malaysian', 'malaysia', 'sepang'], countryCode: 'my' },
  {
    slug: 'south-african',
    aliases: ['south african', 'south africa', 'kyalami'],
    countryCode: 'za',
  },
  { slug: 'san-marino', aliases: ['san marino'], countryCode: 'sm' },
];

// Common driver name aliases (abbreviation → full name patterns)
const DRIVER_ALIASES: Record<string, string[]> = {
  hamilton: ['hamilton', 'lewis', 'ham', 'lh44'],
  verstappen: ['verstappen', 'max', 'ver'],
  leclerc: ['leclerc', 'charles', 'lec'],
  norris: ['norris', 'lando', 'nor'],
  sainz: ['sainz', 'carlos', 'sai'],
  russell: ['russell', 'george', 'rus'],
  piastri: ['piastri', 'oscar', 'pia'],
  alonso: ['alonso', 'fernando', 'alo'],
  vettel: ['vettel', 'sebastian', 'seb', 'vet'],
  ricciardo: ['ricciardo', 'daniel', 'ric'],
  perez: ['perez', 'sergio', 'checo', 'per'],
  schumacher: ['schumacher', 'michael', 'msc'],
  raikkonen: ['raikkonen', 'kimi', 'rai'],
  bottas: ['bottas', 'valtteri', 'bot'],
  gasly: ['gasly', 'pierre', 'gas'],
  ocon: ['ocon', 'esteban', 'oco'],
  tsunoda: ['tsunoda', 'yuki', 'tsu'],
  stroll: ['stroll', 'lance', 'str'],
  hulkenberg: ['hulkenberg', 'nico', 'hul'],
  magnussen: ['magnussen', 'kevin', 'mag'],
  senna: ['senna', 'ayrton'],
  prost: ['prost', 'alain'],
  lauda: ['lauda', 'niki'],
  hunt: ['hunt', 'james'],
  mansell: ['mansell', 'nigel'],
  hakkinen: ['hakkinen', 'mika'],
  hill: ['hill', 'damon'],
  piquet: ['piquet', 'nelson'],
  fangio: ['fangio', 'juan manuel'],
  clark: ['clark', 'jim'],
  stewart: ['stewart', 'jackie'],
};

/**
 * Extract a year from the query string.
 */
function extractYear(query: string): number | null {
  const match = query.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Detect section intent from the query using prefix matching.
 * "tele" matches "telemetry", "rep" matches "replay", etc.
 */
function detectSectionIntent(query: string): (typeof SECTION_INTENTS)[number] | null {
  const lower = query.toLowerCase();

  // First try exact/substring match (multi-word keywords like "head to head")
  for (const intent of SECTION_INTENTS) {
    for (const keyword of intent.keywords) {
      if (lower.includes(keyword)) {
        return intent;
      }
    }
  }

  // Then try prefix matching on individual words in the query
  const words = lower.split(/\s+/);
  for (const intent of SECTION_INTENTS) {
    for (const keyword of intent.keywords) {
      // Only prefix-match single-word keywords (skip multi-word like "head to head")
      if (keyword.includes(' ')) continue;
      // Keyword must be at least 3 chars to prefix-match, and the query word must be 3+ chars
      for (const word of words) {
        if (word.length >= 3 && keyword.startsWith(word)) {
          return intent;
        }
      }
    }
  }

  return null;
}

/**
 * Fuzzy match a query fragment against race name aliases.
 * Supports prefix matching — "mon" matches "monaco", "silv" matches "silverstone".
 * Returns ALL matching races (for ambiguous prefixes like "mont" → Monaco + Canada).
 */
function matchRaceNames(queryTokens: string[]): { slug: string; countryCode: string }[] {
  const joined = queryTokens.join(' ').toLowerCase();
  const words = joined.split(/\s+/).filter(Boolean);

  // Strip noise words that shouldn't participate in race matching
  const raceNoiseWords = new Set([
    'the',
    'of',
    'at',
    'in',
    'for',
    'a',
    'an',
    'to',
    'and',
    'or',
    'between',
    'show',
    'me',
    'go',
    'open',
    'navigate',
    'find',
    'search',
    'look',
    'up',
    'grand',
    'prix',
    'gp',
    'race',
    'session',
    'replay',
    'relive',
    'rewatch',
    'watch',
    'head',
    'head-to-head',
    'h2h',
    'versus',
    'vs',
    'battle',
    'strategy',
    'tire',
    'tyre',
    'pit',
    'stop',
    'pitstop',
    'stint',
    'telemetry',
    'speed',
    'trace',
    'throttle',
    'brake',
    'lap',
    'analysis',
    'time',
    'laptimes',
    'chart',
    'positions',
    'compare',
    'comparison',
  ]);

  const matches: { slug: string; countryCode: string }[] = [];
  const matchedSlugs = new Set<string>();

  // 1. First try exact full-alias match (highest confidence)
  for (const race of RACE_ALIASES) {
    for (const alias of race.aliases) {
      if (joined.includes(alias) && !matchedSlugs.has(race.slug)) {
        matches.push({ slug: race.slug, countryCode: race.countryCode });
        matchedSlugs.add(race.slug);
      }
    }
  }

  // If we got exact matches, return them
  if (matches.length > 0) return matches;

  // 2. Check for "grand prix" or "gp" pattern with a preceding word
  const gpMatch = joined.match(/(\w[\w\s-]*?)\s*(?:grand\s*prix|gp)\b/);
  if (gpMatch) {
    const raceName = gpMatch[1].trim();
    for (const race of RACE_ALIASES) {
      for (const alias of race.aliases) {
        if (
          (raceName.includes(alias) || alias.includes(raceName)) &&
          !matchedSlugs.has(race.slug)
        ) {
          matches.push({ slug: race.slug, countryCode: race.countryCode });
          matchedSlugs.add(race.slug);
        }
      }
    }
    // Prefix match on extracted race name
    if (matches.length === 0) {
      for (const race of RACE_ALIASES) {
        for (const alias of race.aliases) {
          if (raceName.length >= 3 && alias.startsWith(raceName) && !matchedSlugs.has(race.slug)) {
            matches.push({ slug: race.slug, countryCode: race.countryCode });
            matchedSlugs.add(race.slug);
          }
        }
      }
    }
    // If still nothing, use raw name
    if (matches.length === 0) {
      matches.push({ slug: raceName.replace(/\s+/g, '-'), countryCode: '' });
    }
    return matches;
  }

  // 3. Prefix matching — collect ALL races where a meaningful query word is a prefix of an alias
  for (const word of words) {
    if (word.length < 3) continue;
    if (raceNoiseWords.has(word)) continue;
    if (/^\d{4}$/.test(word)) continue; // skip years

    for (const race of RACE_ALIASES) {
      if (matchedSlugs.has(race.slug)) continue;
      for (const alias of race.aliases) {
        // Single-word aliases: prefix match
        if (!alias.includes(' ') && alias.startsWith(word)) {
          matches.push({ slug: race.slug, countryCode: race.countryCode });
          matchedSlugs.add(race.slug);
          break;
        }
        // Multi-word aliases: check if the word is a prefix of the first word
        const aliasFirstWord = alias.split(' ')[0];
        if (aliasFirstWord.length >= 3 && aliasFirstWord.startsWith(word)) {
          matches.push({ slug: race.slug, countryCode: race.countryCode });
          matchedSlugs.add(race.slug);
          break;
        }
      }
    }
  }

  return matches;
}

/**
 * Extract driver references from the query.
 */
function extractDrivers(query: string): string[] {
  const lower = query.toLowerCase();
  const found: string[] = [];

  for (const [surname, aliases] of Object.entries(DRIVER_ALIASES)) {
    for (const alias of aliases) {
      // Only match if it's a word boundary match (not substring of another word)
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        if (!found.includes(surname)) {
          found.push(surname);
        }
        break;
      }
    }
  }

  return found;
}

/**
 * Remove noise words and intent keywords from the query to isolate race/driver tokens.
 */
function stripIntentWords(query: string): string {
  const noiseWords = [
    'the',
    'of',
    'at',
    'in',
    'for',
    'a',
    'an',
    'to',
    'and',
    'or',
    'between',
    'show',
    'me',
    'go',
    'open',
    'navigate',
    'find',
    'search',
    'look',
    'up',
    'grand',
    'prix',
    'gp',
    'race',
    'session',
    // Section keywords
    'replay',
    'relive',
    'rewatch',
    'watch',
    'head',
    'to',
    'head-to-head',
    'h2h',
    'versus',
    'vs',
    'battle',
    'strategy',
    'tire',
    'tyre',
    'pit',
    'stop',
    'pitstop',
    'telemetry',
    'speed',
    'trace',
    'throttle',
    'brake',
    'lap',
    'analysis',
    'time',
    'laptimes',
    'chart',
    'positions',
    'compare',
    'comparison',
  ];

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !noiseWords.includes(w) && !/^\d{4}$/.test(w))
    .join(' ')
    .trim();
}

/**
 * Build the race URL slug from year and race name.
 * Format: {year}-{race-name}-grand-prix
 */
function buildRaceSlug(year: number, raceFragment: string): string {
  // If the fragment already looks like a full slug, use it
  const slug = raceFragment.toLowerCase().replace(/\s+/g, '-');
  // Append "grand-prix" if not already present
  if (!slug.includes('grand-prix')) {
    return `${year}-${slug}-grand-prix`;
  }
  return `${year}-${slug}`;
}

/**
 * A lightweight race index entry for validating that a race actually exists.
 */
export interface RaceIndexEntry {
  year: number;
  name: string; // e.g. "Indian Grand Prix"
}

/**
 * Main smart search function.
 * Analyzes a natural language query and returns navigation suggestions.
 * If raceIndex is provided, results are validated against it (only real races shown).
 * `limit` controls how many no-year race results to return (for pagination).
 */
export function parseSmartQuery(
  query: string,
  raceIndex?: RaceIndexEntry[],
  limit?: number
): SmartResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const results: SmartResult[] = [];
  const year = extractYear(trimmed);
  const sectionIntent = detectSectionIntent(trimmed);
  const drivers = extractDrivers(trimmed);
  const raceMatches = matchRaceNames(trimmed.split(/\s+/));

  // Helper: validate a year+race combo against the index
  const raceExists = (checkYear: number, raceSlug: string): boolean => {
    if (!raceIndex || raceIndex.length === 0) return true; // No index = no validation
    const slugLower = raceSlug.toLowerCase();
    return raceIndex.some((entry) => {
      if (entry.year !== checkYear) return false;
      // Slugify the entry name: "Indian Grand Prix" → "indian grand prix"
      const entryLower = entry.name.toLowerCase();
      // Check if the slug matches the start of any word in the entry name
      // "indian" should match "Indian Grand Prix" but NOT "Indianapolis 500"
      const entryWords = entryLower.split(/\s+/);
      return entryWords.some((word) => word === slugLower || word.startsWith(slugLower + '-'));
    });
  };

  // --- Race + Section navigation ---
  for (const raceMatch of raceMatches) {
    if (year) {
      // Validate: does this race actually exist in this year?
      if (!raceExists(year, raceMatch.slug)) continue;

      const raceSlug = buildRaceSlug(year, raceMatch.slug);
      const raceName = raceMatch.slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const displayName = `${year} ${raceName} Grand Prix`;

      if (sectionIntent) {
        let path = `/race/${raceSlug}/${sectionIntent.section}`;

        if (sectionIntent.type === 'head-to-head' && drivers.length > 0) {
          const params = new URLSearchParams();
          if (drivers[0]) params.set('driver1', drivers[0]);
          if (drivers[1]) params.set('driver2', drivers[1]);
          path += `?${params.toString()}`;
        }

        results.push({
          id: `smart-${raceSlug}-${sectionIntent.section}`,
          label: `${displayName} → ${sectionIntent.label}`,
          description:
            drivers.length > 0
              ? `${drivers.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(' vs ')}`
              : `View ${sectionIntent.label.toLowerCase()} analysis`,
          path,
          type: sectionIntent.type,
          icon: sectionIntent.icon,
          confidence: 0.95,
          countryCode: raceMatch.countryCode,
        });
      }

      results.push({
        id: `smart-${raceSlug}`,
        label: displayName,
        description: year >= 2018 ? 'Full analysis available' : 'Historical results',
        path: `/race/${raceSlug}`,
        type: 'race',
        icon: 'race',
        confidence: sectionIntent ? 0.7 : 0.9,
        countryCode: raceMatch.countryCode,
      });
    } else {
      // Race without year — show all years this race existed, descending
      const raceName = raceMatch.slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Find all years this race exists in the index
      let matchingYears: number[];
      if (raceIndex && raceIndex.length > 0) {
        const slugLower = raceMatch.slug.toLowerCase();
        matchingYears = raceIndex
          .filter((entry) => {
            const entryWords = entry.name.toLowerCase().split(/\s+/);
            return entryWords.some(
              (word) => word === slugLower || word.startsWith(slugLower + '-')
            );
          })
          .map((entry) => entry.year)
          .sort((a, b) => b - a); // descending
      } else {
        // No index — just show current year
        matchingYears = [new Date().getFullYear()];
      }

      // Apply limit
      const maxResults = limit ?? SMART_RESULTS_INITIAL_LIMIT;
      const limitedYears = matchingYears.slice(0, maxResults);

      for (const matchYear of limitedYears) {
        const raceSlug = buildRaceSlug(matchYear, raceMatch.slug);

        if (sectionIntent) {
          let path = `/race/${raceSlug}/${sectionIntent.section}`;
          if (sectionIntent.type === 'head-to-head' && drivers.length > 0) {
            const params = new URLSearchParams();
            if (drivers[0]) params.set('driver1', drivers[0]);
            if (drivers[1]) params.set('driver2', drivers[1]);
            path += `?${params.toString()}`;
          }

          results.push({
            id: `smart-${raceSlug}-${sectionIntent.section}`,
            label: `${matchYear} ${raceName} Grand Prix → ${sectionIntent.label}`,
            description: matchYear >= 2018 ? 'Full analysis' : 'Historical',
            path,
            type: sectionIntent.type,
            icon: sectionIntent.icon,
            confidence: 0.8 - matchingYears.indexOf(matchYear) * 0.01,
            countryCode: raceMatch.countryCode,
          });
        }

        results.push({
          id: `smart-${raceSlug}`,
          label: `${matchYear} ${raceName} Grand Prix`,
          description: matchYear >= 2018 ? 'Full analysis available' : 'Historical results',
          path: `/race/${raceSlug}`,
          type: 'race',
          icon: 'race',
          confidence: sectionIntent
            ? 0.6 - matchingYears.indexOf(matchYear) * 0.01
            : 0.85 - matchingYears.indexOf(matchYear) * 0.01,
          countryCode: raceMatch.countryCode,
        });
      }
    }
  }

  // --- H2H intent without a specific race ---
  if (sectionIntent?.type === 'head-to-head' && raceMatches.length === 0 && drivers.length >= 1) {
    // If we have a year, suggest the compare page or a generic H2H
    const desc =
      drivers.length >= 2
        ? `${drivers[0].charAt(0).toUpperCase() + drivers[0].slice(1)} vs ${drivers[1].charAt(0).toUpperCase() + drivers[1].slice(1)}`
        : `${drivers[0].charAt(0).toUpperCase() + drivers[0].slice(1)} vs nearest rival`;

    results.push({
      id: `smart-compare-${drivers.join('-')}`,
      label: `Compare Drivers: ${desc}`,
      description: 'Season-wide comparison',
      path: `/compare/drivers`,
      type: 'compare',
      icon: 'compare',
      confidence: 0.75,
    });
  }

  // --- Compare intent ---
  if (!sectionIntent && drivers.length >= 2) {
    const lower = trimmed.toLowerCase();
    if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) {
      results.push({
        id: `smart-compare-${drivers.join('-')}`,
        label: `Compare: ${drivers.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(' vs ')}`,
        description: 'Head-to-head season comparison',
        path: `/compare/drivers`,
        type: 'compare',
        icon: 'compare',
        confidence: 0.85,
      });
    }
  }

  // --- Replay intent with year but no race match ---
  if (sectionIntent?.type === 'replay' && year && raceMatches.length === 0) {
    // User said something like "replay 2024" — can't determine race
    // Don't add a result, let the Supabase search handle it
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}
