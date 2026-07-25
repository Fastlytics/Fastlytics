export const getCountryCode = (location: string | undefined): string => {
  if (!location) return 'xx';
  const cleanLocation = location.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const countryMap: Record<string, string> = {
    Australia: 'au', Austria: 'at', Azerbaijan: 'az', Bahrain: 'bh',
    Belgium: 'be', Brazil: 'br', Canada: 'ca', China: 'cn',
    Denmark: 'dk', 'Emilia Romagna': 'it', France: 'fr',
    Germany: 'de', 'Great Britain': 'gb', 'United Kingdom': 'gb',
    Hungary: 'hu', India: 'in', Italy: 'it', Japan: 'jp',
    'Las Vegas': 'us', Malaysia: 'my', Mexico: 'mx', Miami: 'us',
    Monaco: 'mc', Netherlands: 'nl', Portugal: 'pt', Qatar: 'qa',
    Russia: 'ru', 'Saudi Arabia': 'sa', Singapore: 'sg',
    'South Africa': 'za', Spain: 'es', Styria: 'at', Turkey: 'tr',
    'Abu Dhabi': 'ae', 'United Arab Emirates': 'ae', UAE: 'ae',
    'Yas Marina': 'ae', 'United States': 'us', USA: 'us',
    Sakhir: 'bh', 'Miami Gardens': 'us', Jeddah: 'sa', Lusail: 'qa',
    Imola: 'it', Monza: 'it', 'São Paulo': 'br', Spielberg: 'at',
    Silverstone: 'gb', Spa: 'be', Zandvoort: 'nl', Austin: 'us',
    Montréal: 'ca', Montreal: 'ca', Shanghai: 'cn', Baku: 'az',
    Barcelona: 'es', Budapest: 'hu', Suzuka: 'jp', 'Mexico City': 'mx',
  };
  const countryEntry = Object.entries(countryMap).find(([country]) =>
    cleanLocation.includes(country)
  );
  if (countryEntry) return countryEntry[1].toLowerCase();
  return 'xx';
};

export const getNationalityCountryCode = (nationality: string | undefined): string => {
  if (!nationality) return 'xx';
  const map: Record<string, string> = {
    British: 'gb', English: 'gb', Monegasque: 'mc', Dutch: 'nl',
    Spanish: 'es', French: 'fr', German: 'de', Italian: 'it',
    Australian: 'au', Finnish: 'fi', Swedish: 'se', Danish: 'dk',
    Norwegian: 'no', Belgian: 'be', Swiss: 'ch', Austrian: 'at',
    Canadian: 'ca', American: 'us', Mexican: 'mx', Brazilian: 'br',
    Argentine: 'ar', Colombian: 'co', Venezuelan: 've', Japanese: 'jp',
    Chinese: 'cn', Thai: 'th', Indian: 'in', Malaysian: 'my',
    Indonesian: 'id', 'New Zealander': 'nz', 'South African': 'za',
    Russian: 'ru', Polish: 'pl', Hungarian: 'hu', Czech: 'cz',
    Portuguese: 'pt', Greek: 'gr', Turkish: 'tr', Israeli: 'il',
    Korean: 'kr', Rhodesian: 'zw', 'East German': 'de', Uruguayan: 'uy',
    Chilean: 'cl', Liechtensteiner: 'li', Irish: 'ie',
    'Northern Irish': 'gb', Welsh: 'gb', Scottish: 'gb',
    'Hong Kong': 'hk', Monégasque: 'mc',
  };
  return map[nationality] || 'xx';
};
