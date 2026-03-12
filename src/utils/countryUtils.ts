// Country name to ISO country code mapping for flags
export const getCountryCode = (location: string | undefined): string => {
  if (!location) return 'xx';
  const cleanLocation = location.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const countryMap: Record<string, string> = {
    'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az', 'Bahrain': 'bh',
    'Belgium': 'be', 'Brazil': 'br', 'Canada': 'ca', 'China': 'cn',
    'Denmark': 'dk', 'Emilia Romagna': 'it', 'France': 'fr', 'Germany': 'de',
    'Great Britain': 'gb', 'United Kingdom': 'gb', 'Hungary': 'hu', 'India': 'in',
    'Italy': 'it', 'Japan': 'jp', 'Las Vegas': 'us', 'Malaysia': 'my',
    'Mexico': 'mx', 'Miami': 'us', 'Monaco': 'mc', 'Netherlands': 'nl',
    'Portugal': 'pt', 'Qatar': 'qa', 'Russia': 'ru', 'Saudi Arabia': 'sa',
    'Singapore': 'sg', 'South Africa': 'za', 'Spain': 'es', 'Styria': 'at',
    'Turkey': 'tr', 'Abu Dhabi': 'ae', 'United Arab Emirates': 'ae', 'UAE': 'ae', 'Yas Marina': 'ae',
    'United States': 'us', 'USA': 'us',
    'Sakhir': 'bh', 'Miami Gardens': 'us', 'Jeddah': 'sa', 'Lusail': 'qa',
    'Imola': 'it', 'Monza': 'it', 'São Paulo': 'br', 'Spielberg': 'at',
    'Silverstone': 'gb', 'Spa': 'be', 'Zandvoort': 'nl', 'Austin': 'us',
    'Montréal': 'ca', 'Montreal': 'ca', 'Shanghai': 'cn', 'Baku': 'az',
    'Barcelona': 'es', 'Budapest': 'hu', 'Suzuka': 'jp', 'Mexico City': 'mx'
  };
  for (const [country, code] of Object.entries(countryMap)) {
    if (cleanLocation.includes(country)) return code.toLowerCase();
  }
  return 'xx';
};