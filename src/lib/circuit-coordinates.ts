export interface CircuitCoords {
  lat: number;
  lng: number;
  /** IANA timezone identifier for the circuit */
  timezone: string;
}

/**
 * Lat/lng for current F1 circuits, keyed by lowercase slug(s).
 * Multiple aliases (event name + location) map to the same coords so that
 * lookups can succeed from either `EventName` or `Location`.
 */
export const CIRCUIT_COORDINATES: Record<string, CircuitCoords> = {
  // Bahrain
  'bahrain-grand-prix': { lat: 26.0325, lng: 50.5106, timezone: 'Asia/Bahrain' },
  bahrain: { lat: 26.0325, lng: 50.5106, timezone: 'Asia/Bahrain' },
  sakhir: { lat: 26.0325, lng: 50.5106, timezone: 'Asia/Bahrain' },
  // Saudi Arabia
  'saudi-arabian-grand-prix': { lat: 21.6319, lng: 39.1044, timezone: 'Asia/Riyadh' },
  'jeddah-grand-prix': { lat: 21.6319, lng: 39.1044, timezone: 'Asia/Riyadh' },
  jeddah: { lat: 21.6319, lng: 39.1044, timezone: 'Asia/Riyadh' },
  // Australia
  'australian-grand-prix': { lat: -37.8497, lng: 144.968, timezone: 'Australia/Melbourne' },
  melbourne: { lat: -37.8497, lng: 144.968, timezone: 'Australia/Melbourne' },
  // Japan
  'japanese-grand-prix': { lat: 34.8431, lng: 136.541, timezone: 'Asia/Tokyo' },
  suzuka: { lat: 34.8431, lng: 136.541, timezone: 'Asia/Tokyo' },
  // China
  'chinese-grand-prix': { lat: 31.3389, lng: 121.2197, timezone: 'Asia/Shanghai' },
  shanghai: { lat: 31.3389, lng: 121.2197, timezone: 'Asia/Shanghai' },
  // Miami
  'miami-grand-prix': { lat: 25.9581, lng: -80.2389, timezone: 'America/New_York' },
  miami: { lat: 25.9581, lng: -80.2389, timezone: 'America/New_York' },
  // Emilia Romagna
  'emilia-romagna-grand-prix': { lat: 44.3439, lng: 11.7167, timezone: 'Europe/Rome' },
  imola: { lat: 44.3439, lng: 11.7167, timezone: 'Europe/Rome' },
  // Monaco
  'monaco-grand-prix': { lat: 43.7347, lng: 7.4206, timezone: 'Europe/Monaco' },
  monaco: { lat: 43.7347, lng: 7.4206, timezone: 'Europe/Monaco' },
  // Spain
  'spanish-grand-prix': { lat: 41.57, lng: 2.2611, timezone: 'Europe/Madrid' },
  barcelona: { lat: 41.57, lng: 2.2611, timezone: 'Europe/Madrid' },
  // Canada
  'canadian-grand-prix': { lat: 45.5, lng: -73.5228, timezone: 'America/Toronto' },
  montreal: { lat: 45.5, lng: -73.5228, timezone: 'America/Toronto' },
  // Austria
  'austrian-grand-prix': { lat: 47.2197, lng: 14.7647, timezone: 'Europe/Vienna' },
  spielberg: { lat: 47.2197, lng: 14.7647, timezone: 'Europe/Vienna' },
  'red-bull-ring': { lat: 47.2197, lng: 14.7647, timezone: 'Europe/Vienna' },
  // Britain
  'british-grand-prix': { lat: 52.0786, lng: -1.0169, timezone: 'Europe/London' },
  silverstone: { lat: 52.0786, lng: -1.0169, timezone: 'Europe/London' },
  // Hungary
  'hungarian-grand-prix': { lat: 47.5829, lng: 19.2486, timezone: 'Europe/Budapest' },
  hungaroring: { lat: 47.5829, lng: 19.2486, timezone: 'Europe/Budapest' },
  // Belgium
  'belgian-grand-prix': { lat: 50.4372, lng: 5.9714, timezone: 'Europe/Brussels' },
  spa: { lat: 50.4372, lng: 5.9714, timezone: 'Europe/Brussels' },
  // Netherlands
  'dutch-grand-prix': { lat: 52.3888, lng: 4.5409, timezone: 'Europe/Amsterdam' },
  zandvoort: { lat: 52.3888, lng: 4.5409, timezone: 'Europe/Amsterdam' },
  // Italy
  'italian-grand-prix': { lat: 45.6156, lng: 9.2811, timezone: 'Europe/Rome' },
  monza: { lat: 45.6156, lng: 9.2811, timezone: 'Europe/Rome' },
  // Azerbaijan
  'azerbaijan-grand-prix': { lat: 40.3725, lng: 49.8533, timezone: 'Asia/Baku' },
  baku: { lat: 40.3725, lng: 49.8533, timezone: 'Asia/Baku' },
  // Singapore
  'singapore-grand-prix': { lat: 1.2914, lng: 103.8644, timezone: 'Asia/Singapore' },
  singapore: { lat: 1.2914, lng: 103.8644, timezone: 'Asia/Singapore' },
  // USA (Austin)
  'united-states-grand-prix': { lat: 30.1328, lng: -97.6411, timezone: 'America/Chicago' },
  austin: { lat: 30.1328, lng: -97.6411, timezone: 'America/Chicago' },
  // Mexico
  'mexican-grand-prix': { lat: 19.4042, lng: -99.0907, timezone: 'America/Mexico_City' },
  'mexico-city': { lat: 19.4042, lng: -99.0907, timezone: 'America/Mexico_City' },
  // Brazil
  'brazilian-grand-prix': { lat: -23.7036, lng: -46.6997, timezone: 'America/Sao_Paulo' },
  interlagos: { lat: -23.7036, lng: -46.6997, timezone: 'America/Sao_Paulo' },
  // Las Vegas
  'las-vegas-grand-prix': { lat: 36.1147, lng: -115.1728, timezone: 'America/Los_Angeles' },
  'las-vegas': { lat: 36.1147, lng: -115.1728, timezone: 'America/Los_Angeles' },
  // Qatar
  'qatar-grand-prix': { lat: 25.4919, lng: 51.4542, timezone: 'Asia/Qatar' },
  losail: { lat: 25.4919, lng: 51.4542, timezone: 'Asia/Qatar' },
  // Abu Dhabi
  'abu-dhabi-grand-prix': { lat: 24.4672, lng: 54.6031, timezone: 'Asia/Dubai' },
  'yas-marina': { lat: 24.4672, lng: 54.6031, timezone: 'Asia/Dubai' },
};

/**
 * Look up circuit coordinates by event name or location.
 * Falls back to a partial-match scan if an exact slug is not found.
 */
export function getCircuitCoords(eventName?: string, location?: string): CircuitCoords | null {
  if (!eventName && !location) return null;
  const normalizedEventName = eventName?.toLowerCase().replace(/\s+/g, '-') ?? '';
  const normalizedLocation = location?.toLowerCase().replace(/\s+/g, '-') ?? '';

  if (normalizedEventName && CIRCUIT_COORDINATES[normalizedEventName]) {
    return CIRCUIT_COORDINATES[normalizedEventName];
  }
  if (normalizedLocation && CIRCUIT_COORDINATES[normalizedLocation]) {
    return CIRCUIT_COORDINATES[normalizedLocation];
  }
  // Partial match fallback
  const key = Object.keys(CIRCUIT_COORDINATES).find(
    (k) => normalizedEventName.includes(k) || normalizedLocation.includes(k)
  );
  return key ? CIRCUIT_COORDINATES[key] : null;
}
