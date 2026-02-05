export const driverImages2023: Record<string, string> = {
  ALB: '/drivers/2023/albon.png',
  ALO: '/drivers/2023/alonso.png',
  BOT: '/drivers/2023/bottas.png',
  DEV: '/drivers/2023/devries.png',
  GAS: '/drivers/2023/gasly.png',
  HAM: '/drivers/2023/hamilton.png',
  HUL: '/drivers/2023/hulkenberg.png',
  LAW: '/drivers/2023/lawson.png',
  LEC: '/drivers/2023/leclerc.png',
  MAG: '/drivers/2023/magnussen.png',
  NOR: '/drivers/2023/norris.png',
  OCO: '/drivers/2023/ocon.png',
  PER: '/drivers/2023/perez.png',
  PIA: '/drivers/2023/piasrtri.png',
  RIC: '/drivers/2023/ricciardo.png',
  RUS: '/drivers/2023/russell.png',
  SAI: '/drivers/2023/sainz.png',
  SAR: '/drivers/2023/sargeant.png',
  STR: '/drivers/2023/stroll.png',
  TSU: '/drivers/2023/tsunoda.png',
  VER: '/drivers/2023/verstappen.png',
  ZHO: '/drivers/2023/zhouguanyu.png',
};

export const driverImages2024: Record<string, string> = {
  ALB: '/drivers/2024/alealb01.png',
  SAI: '/drivers/2024/carsai01.png',
  LEC: '/drivers/2024/chalec01.png',
  RIC: '/drivers/2024/danric01.png',
  OCO: '/drivers/2024/estoco01.png',
  ALO: '/drivers/2024/feralo01.png',
  COL: '/drivers/2024/fracol01.png',
  RUS: '/drivers/2024/georus01.png',
  ZHO: '/drivers/2024/guazho01.png',
  MAG: '/drivers/2024/kevmag01.png',
  NOR: '/drivers/2024/lannor01.png',
  STR: '/drivers/2024/lanstr01.png',
  HAM: '/drivers/2024/lewham01.png',
  LAW: '/drivers/2024/lialaw01.png',
  SAR: '/drivers/2024/logsar01.png',
  VER: '/drivers/2024/maxver01.png',
  HUL: '/drivers/2024/nichul01.png',
  BEA: '/drivers/2024/olibea01.png',
  PIA: '/drivers/2024/oscpia01.png',
  GAS: '/drivers/2024/piegas01.png',
  PER: '/drivers/2024/serper01.png',
  BOT: '/drivers/2024/valbot01.png',
  TSU: '/drivers/2024/yuktsu01.png',
};

export const driverImages2025: Record<string, string> = {
  ALB: '/drivers/2025williamsalealb01right.avif',
  ALO: '/drivers/2025astonmartinferalo01right.avif',
  BEA: '/drivers/2025haasf1teamolibea01right.avif',
  BOR: '/drivers/2025kicksaubergabbor01right.avif',
  COL: '/drivers/2025alpinefracol01right.avif',
  GAS: '/drivers/2025alpinepiegas01right.avif',
  HAD: '/drivers/2025racingbullsisahad01right.avif',
  HAM: '/drivers/2025ferrarilewham01right.avif',
  HUL: '/drivers/2025kicksaubernichul01right.avif',
  LAW: '/drivers/2025racingbullslialaw01right.avif',
  LEC: '/drivers/2025ferrarichalec01right.avif',
  NOR: '/drivers/2025mclarenlannor01right.avif',
  OCO: '/drivers/2025haasf1teamestoco01right.avif',
  PIA: '/drivers/2025mclarenoscpia01right.avif',
  RUS: '/drivers/2025mercedesgeorus01right.avif',
  SAI: '/drivers/2025williamscarsai01right.avif',
  STR: '/drivers/2025astonmartinlanstr01right.avif',
  TSU: '/drivers/2025redbullracingyuktsu01right.avif',
  VER: '/drivers/2025redbullracingmaxver01right.avif',
  ANT: '/drivers/2025mercedesandant01right.avif',
};

export const carImages2023: Record<string, string> = {
  alfaromeo: '/cars/2023/alfaromeo.png',
  alphatauri: '/cars/2023/alphatauri.png',
  alpine: '/cars/2023/alpine.png',
  astonmartin: '/cars/2023/astonmartin.png',
  ferrari: '/cars/2023/ferrari.png',
  haas: '/cars/2023/haas.png',
  mclaren: '/cars/2023/mclaren.png',
  mercedes: '/cars/2023/mercedes.png',
  redbull: '/cars/2023/redbull.png',
  williams: '/cars/2023/williams.png',
};

export const carImages2024: Record<string, string> = {
  alpine: '/cars/2024/alpine.png',
  astonmartin: '/cars/2024/aston-martin.png',
  ferrari: '/cars/2024/ferrari.png',
  haas: '/cars/2024/haas.png',
  kicksauber: '/cars/2024/kick-sauber.png',
  sauber: '/cars/2024/kick-sauber.png',
  mclaren: '/cars/2024/mclaren.png',
  mercedes: '/cars/2024/mercedes.png',
  rb: '/cars/2024/rb.png',
  racingbulls: '/cars/2024/rb.png',
  redbull: '/cars/2024/red-bull-racing.png',
  williams: '/cars/2024/williams.png',
};

export const carImages2025: Record<string, string> = {
  mclaren: '/cars/2025mclarencarright.avif',
  mercedes: '/cars/2025mercedescarright.avif',
  redbull: '/cars/2025redbullracingcarright.avif',
  ferrari: '/cars/2025ferraricarright.avif',
  alpine: '/cars/2025alpinecarright.avif',
  astonmartin: '/cars/2025astonmartincarright.avif',
  williams: '/cars/2025williamscarright.avif',
  haas: '/cars/2025haascarright.avif',
  alfaromeo: '/cars/2025kicksaubercarright.avif',
  sauber: '/cars/2025kicksaubercarright.avif',
  kicksauber: '/cars/2025kicksaubercarright.avif',
  alphatauri: '/cars/2025racingbullscarright.avif',
  racingbulls: '/cars/2025racingbullscarright.avif',
  rb: '/cars/2025racingbullscarright.avif',
};

export const getDriverImage = (
  driverCode: string,
  year: number,
  openF1Url?: string | null
): string => {
  if (!driverCode) return '';

  const code = driverCode.toUpperCase();

  if (year === 2023) {
    return driverImages2023[code] || driverImages2025[code] || '';
  }
  if (year === 2024) {
    return driverImages2024[code] || driverImages2025[code] || '';
  }
  if (year === 2025) {
    return driverImages2025[code] || '';
  }

  if (year >= 2026) {
    if (openF1Url) return openF1Url;
    return driverImages2025[code] || '';
  }

  return driverImages2025[code] || '';
};

export const getCarImage = (teamName: string, year: number): string => {
  if (!teamName) return '';

  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchKey = (map: Record<string, string>, name: string) => {
    if (map[name]) return map[name];

    if (name.includes('mclaren')) return map['mclaren'];
    if (name.includes('mercedes')) return map['mercedes'];
    if (name.includes('redbull')) return map['redbull'];
    if (name.includes('ferrari')) return map['ferrari'];
    if (name.includes('alpine')) return map['alpine'];
    if (name.includes('aston')) return map['astonmartin'];
    if (name.includes('williams')) return map['williams'];
    if (name.includes('haas')) return map['haas'];
    if (name.includes('sauber') || name.includes('alfa'))
      return map['sauber'] || map['kicksauber'] || map['alfaromeo'];
    if (
      name.includes('racingbulls') ||
      name.includes('alpha') ||
      name.includes('tororosso') ||
      name === 'rb'
    )
      return map['racingbulls'] || map['rb'] || map['alphatauri'];

    return '';
  };

  if (year === 2023) {
    return matchKey(carImages2023, simpleName) || matchKey(carImages2025, simpleName);
  }
  if (year === 2024) {
    return matchKey(carImages2024, simpleName) || matchKey(carImages2025, simpleName);
  }
  if (year === 2025) {
    return matchKey(carImages2025, simpleName);
  }

  if (year >= 2026) {
    return matchKey(carImages2025, simpleName);
  }

  return matchKey(carImages2025, simpleName);
};
