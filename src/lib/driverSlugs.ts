/**
 * Maps driver abbreviation codes to their URL slugs (Jolpica/Ergast reference format).
 *
 * The slug is what appears in /drivers/:slug URLs and matches the `reference`
 * field in the f1_drivers Supabase table.
 *
 * Fallback: if a code isn't in the map, derive from the driver's last name.
 */

const CODE_TO_SLUG: Record<string, string> = {
  // 2025–2026 grid
  VER: 'max_verstappen',
  HAM: 'hamilton',
  NOR: 'norris',
  LEC: 'leclerc',
  SAI: 'sainz',
  RUS: 'russell',
  PIA: 'piastri',
  ALO: 'alonso',
  STR: 'stroll',
  OCO: 'ocon',
  GAS: 'gasly',
  HUL: 'hulkenberg',
  MAG: 'kevin_magnussen',
  ALB: 'albon',
  TSU: 'tsunoda',
  ZHO: 'zhou',
  BOT: 'bottas',
  LAW: 'lawson',
  ANT: 'antonelli',
  BOR: 'bortoleto',
  BEA: 'bearman',
  DOO: 'doohan',
  HAD: 'hadjar',
  COL: 'colapinto',
  LIN: 'lindblad',

  // Recent drivers (2019–2024)
  PER: 'perez',
  RIC: 'ricciardo',
  VET: 'vettel',
  RAI: 'raikkonen',
  MSC: 'mick_schumacher',
  MAZ: 'mazepin',
  LAT: 'latifi',
  GIO: 'giovinazzi',
  KVY: 'kvyat',
  GRO: 'grosjean',
  SAR: 'sargeant',
  DEV: 'de_vries',
  KUB: 'kubica',
};

/**
 * Returns the URL slug for a driver given their abbreviation code and full name.
 *
 * Lookup order:
 * 1. Known mapping (CODE_TO_SLUG)
 * 2. Derive from last name (lowercase, spaces → underscores)
 */
export function getDriverSlug(code: string, name: string): string {
  const mapped = CODE_TO_SLUG[code?.toUpperCase()];
  if (mapped) return mapped;

  // Fallback: extract last name from full name and lowercase it
  const parts = name.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
  return lastName.toLowerCase().replace(/[^a-z0-9_]/g, '');
}
