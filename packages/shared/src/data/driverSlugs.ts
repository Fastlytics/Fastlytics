const CODE_TO_SLUG: Record<string, string> = {
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

export function getDriverSlug(code: string, name: string): string {
  const mapped = CODE_TO_SLUG[code?.toUpperCase()];
  if (mapped) return mapped;

  const parts = name.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
  return lastName.toLowerCase().replace(/[^a-z0-9_]/g, '');
}
