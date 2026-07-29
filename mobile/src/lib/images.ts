const IMAGE_BASE_URL =
  process.env.EXPO_PUBLIC_CDN_URL ??
  'https://fastlytics-api-proxy-v2.subhashgottumukkala17.workers.dev';

const driverImages: Record<string, Record<string, string>> = {
  '2025': {
    ALB: 'williamsalealb01right.avif',
    ALO: 'astonmartinferalo01right.avif',
    ANT: 'mercedesandant01right.avif',
    BEA: 'haasf1teamolibea01right.avif',
    BOR: 'kicksaubergabbor01right.avif',
    COL: 'alpinefracol01right.avif',
    GAS: 'alpinepiegas01right.avif',
    HAD: 'racingbullsisahad01right.avif',
    HAM: 'ferrarilewham01right.avif',
    HUL: 'kicksaubernichul01right.avif',
    LAW: 'racingbullslialaw01right.avif',
    LEC: 'ferrarichalec01right.avif',
    NOR: 'mclarenlannor01right.avif',
    OCO: 'haasf1teamestoco01right.avif',
    PIA: 'mclarenoscpia01right.avif',
    RUS: 'mercedesgeorus01right.avif',
    SAI: 'williamscarsai01right.avif',
    STR: 'astonmartinlanstr01right.avif',
    TSU: 'redbullracingyuktsu01right.avif',
    VER: 'redbullracingmaxver01right.avif',
  },
  '2026': {
    ALB: '2026williamsalealb01right.avif',
    ALO: '2026astonmartinferalo01right.avif',
    ANT: '2026mercedesandant01right.avif',
    ARV: '2026racingbullsarvlin01right.avif',
    BEA: '2026haasf1teamolibea01right.avif',
    BOT: '2026cadillacvalbot01right.avif',
    BOR: '2026audigabbor01right.avif',
    COL: '2026alpinefracol01right.avif',
    GAS: '2026alpinepiegas01right.avif',
    HAD: '2026redbullracingisahad01right.avif',
    HAM: '2026ferrarilewham01right.avif',
    HUL: '2026audinichul01right.avif',
    LAW: '2026racingbullslialaw01right.avif',
    LEC: '2026ferrarichalec01right.avif',
    LIN: '2026racingbullsarvlin01right.avif',
    NOR: '2026mclarenlannor01right.avif',
    OCO: '2026haasf1teamestoco01right.avif',
    PER: '2026cadillacserper01right.avif',
    PIA: '2026mclarenoscpia01right.avif',
    RUS: '2026mercedesgeorus01right.avif',
    SAI: '2026williamscarsai01right.avif',
    STR: '2026astonmartinlanstr01right.avif',
    VER: '2026redbullracingmaxver01right.avif',
  },
};

const carImages: Record<string, string> = {
  mclaren: '2025mclarencarright.avif',
  mercedes: '2025mercedescarright.avif',
  redbull: '2025redbullracingcarright.avif',
  ferrari: '2025ferraricarright.avif',
  alpine: '2025alpinecarright.avif',
  astonmartin: '2025astonmartincarright.avif',
  williams: '2025williamscarright.avif',
  haas: '2025haascarright.avif',
  alfaromeo: '2025kicksaubercarright.avif',
  sauber: '2025kicksaubercarright.avif',
  kicksauber: '2025kicksaubercarright.avif',
  alphatauri: '2025racingbullscarright.avif',
  racingbulls: '2025racingbullscarright.avif',
  rb: '2025racingbullscarright.avif',
  audi: '2026audicarright.avif',
  cadillac: '2026cadillaccarright.avif',
};

const carImages2026: Record<string, string> = {
  alpine: '2026alpinecarright.avif',
  astonmartin: '2026astonmartincarright.avif',
  audi: '2026audicarright.avif',
  cadillac: '2026cadillaccarright.avif',
  ferrari: '2026ferraricarright.avif',
  haas: '2026haasf1teamcarright.avif',
  mclaren: '2026mclarencarright.avif',
  mercedes: '2026mercedescarright.avif',
  racingbulls: '2026racingbullscarright.avif',
  rb: '2026racingbullscarright.avif',
  redbull: '2026redbullracingcarright.avif',
  williams: '2026williamscarright.avif',
};

export const getDriverImage = (driverCode: string, year: number): string => {
  const code = driverCode?.toUpperCase();
  if (!code) return '';
  const db = year >= 2026 ? driverImages['2026'] : driverImages['2025'] || driverImages['2026'];
  const file = db[code];
  return file ? `${IMAGE_BASE_URL}/drivers/${year >= 2026 ? 2026 : 2025}/${file}` : '';
};

export const getCarImage = (teamName: string, year: number): string => {
  if (!teamName) return '';
  const name = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const db = year >= 2026 ? carImages2026 : { ...carImages, ...carImages2026 };
  const find = (map: Record<string, string>) => {
    if (map[name]) return map[name];
    if (name.includes('mclaren')) return map['mclaren'];
    if (name.includes('mercedes')) return map['mercedes'];
    if (name.includes('redbull') || name.includes('red')) return map['redbull'] || map['mclaren'];
    if (name.includes('ferrari')) return map['ferrari'];
    if (name.includes('alpine')) return map['alpine'];
    if (name.includes('aston')) return map['astonmartin'];
    if (name.includes('williams')) return map['williams'];
    if (name.includes('haas')) return map['haas'];
    if (name.includes('sauber') || name.includes('alfa'))
      return map['sauber'] || map['kicksauber'] || map['alfaromeo'];
    if (name.includes('audi')) return map['audi'];
    if (name.includes('cadillac')) return map['cadillac'];
    if (name.includes('racingbulls') || name.includes('alpha') || name.includes('rb'))
      return map['racingbulls'] || map['rb'] || map['alphatauri'];
    return '';
  };
  const file = find(db);
  return file ? `${IMAGE_BASE_URL}/cars/${year >= 2026 ? 2026 : 2025}/${file}` : '';
};
