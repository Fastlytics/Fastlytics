const defaultColors = [
  '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7',
  '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#84CC16',
];

const seasonalDriverColorMap: Record<string, Record<string, string>> = {
  '2019': {
    HAM: '#00D2BE', BOT: '#00D2BE',
    VET: '#DC0000', LEC: '#DC0000',
    VER: '#0600EF', GAS: '#0600EF',
    SAI: '#FF8700', NOR: '#FF8700',
    RIC: '#FFF500', HUL: '#FFF500',
    KVY: '#2B4562', ALB: '#2B4562',
    STR: '#F596C8', PER: '#F596C8',
    RAI: '#900000', GIO: '#900000',
    MAG: '#B6BABD', GRO: '#B6BABD',
    RUS: '#FFFFFF', KUB: '#FFFFFF',
  },
  '2020': {
    HAM: '#000000', BOT: '#000000',
    VET: '#DC0000', LEC: '#DC0000',
    VER: '#0600EF', ALB: '#0600EF',
    SAI: '#FF8700', NOR: '#FF8700',
    RIC: '#FFF500', OCO: '#FFF500',
    GAS: '#FFFFFF', KVY: '#FFFFFF',
    STR: '#F596C8', PER: '#F596C8',
    RAI: '#900000', GIO: '#900000',
    MAG: '#B6BABD', GRO: '#B6BABD',
    RUS: '#005AFF', LAT: '#005AFF',
  },
  '2021': {
    HAM: '#00D2BE', BOT: '#00D2BE',
    VER: '#0600EF', PER: '#0600EF',
    RIC: '#FF8700', NOR: '#FF8700',
    VET: '#006F62', STR: '#006F62',
    ALO: '#0090FF', OCO: '#0090FF',
    LEC: '#DC0000', SAI: '#DC0000',
    GAS: '#2B4562', TSU: '#2B4562',
    RAI: '#900000', GIO: '#900000',
    MAZ: '#FFFFFF', MSC: '#FFFFFF',
    LAT: '#005AFF', RUS: '#005AFF',
  },
  '2022': {
    HAM: '#6CD3BF', RUS: '#6CD3BF',
    VER: '#1E5BC6', PER: '#1E5BC6',
    LEC: '#ED1C24', SAI: '#ED1C24',
    NOR: '#F58020', RIC: '#F58020',
    ALO: '#2293D1', OCO: '#2293D1',
    GAS: '#4E7C9B', TSU: '#4E7C9B',
    VET: '#2D826D', STR: '#2D826D',
    LAT: '#37BEDD', ALB: '#37BEDD',
    ZHO: '#B12039', BOT: '#B12039',
    MAG: '#B6BABD', MSC: '#B6BABD',
  },
  '2023': {
    VER: '#3671C6', PER: '#3671C6',
    LEC: '#F91536', SAI: '#F91536',
    HAM: '#6CD3BF', RUS: '#6CD3BF',
    OCO: '#2293D1', GAS: '#2293D1',
    NOR: '#F58020', PIA: '#F58020',
    BOT: '#C92D4B', ZHO: '#C92D4B',
    STR: '#358C75', ALO: '#358C75',
    MAG: '#B6BABD', HUL: '#B6BABD',
    TSU: '#5E8FAA', DEV: '#5E8FAA', RIC: '#5E8FAA', LAW: '#5E8FAA',
    ALB: '#37BEDD', SAR: '#37BEDD',
  },
  '2024': {
    VER: '#3671C6', PER: '#3671C6',
    HAM: '#6CD3BF', RUS: '#6CD3BF',
    LEC: '#F91536', SAI: '#F91536',
    NOR: '#FF8700', PIA: '#FF8700',
    ALO: '#00594F', STR: '#00594F',
    GAS: '#0090FF', OCO: '#0090FF',
    ALB: '#00A3E0', SAR: '#00A3E0', COL: '#00A3E0',
    RIC: '#4E7C9B', TSU: '#4E7C9B', LAW: '#4E7C9B',
    BOT: '#900000', ZHO: '#900000',
    HUL: '#B6BABD', MAG: '#B6BABD', BEA: '#B6BABD',
  },
  '2025': {
    VER: '#4781D7', TSU: '#4781D7',
    RUS: '#6CD3BF', ANT: '#6CD3BF',
    LEC: '#FF2800', HAM: '#FF2800',
    NOR: '#FF8700', PIA: '#FF8700',
    ALO: '#00594F', STR: '#00594F',
    GAS: '#0090FF', DOO: '#0090FF', COL: '#0090FF',
    ALB: '#00A3E0', SAI: '#00A3E0',
    HAD: '#4E7C9B', LAW: '#4E7C9B',
    HUL: '#52E252', BOR: '#52E252',
    OCO: '#B6BABD', BEA: '#B6BABD',
  },
  '2026': {
    VER: '#4781D7', HAD: '#4781D7',
    RUS: '#6CD3BF', ANT: '#6CD3BF',
    LEC: '#FF2800', HAM: '#FF2800',
    NOR: '#FF8700', PIA: '#FF8700',
    ALO: '#00594F', STR: '#00594F',
    GAS: '#0090FF', COL: '#0090FF',
    ALB: '#00A3E0', SAI: '#00A3E0',
    LAW: '#6692FF', LIN: '#6692FF',
    HUL: '#00E701', BOR: '#00E701',
    BOT: '#C6A664', PER: '#C6A664',
    OCO: '#B6BABD', BEA: '#B6BABD',
  },
};

let fallbackColorIndex = 0;

export const driverColor = (driverCode: string, season: number | string): string => {
  const year = String(season);
  const latestYear = '2025';
  const yearMap = seasonalDriverColorMap[year];

  if (yearMap && yearMap[driverCode]) {
    return yearMap[driverCode];
  }

  const latestMap = seasonalDriverColorMap[latestYear];
  if (latestMap && latestMap[driverCode]) {
    return latestMap[driverCode];
  }

  for (const y in seasonalDriverColorMap) {
    if (seasonalDriverColorMap[y][driverCode]) {
      return seasonalDriverColorMap[y][driverCode];
    }
  }

  const color = defaultColors[fallbackColorIndex % defaultColors.length];
  fallbackColorIndex++;
  return color;
};
