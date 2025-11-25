// Helper function to get a consistent color for a driver based on the season

// Basic color palette for fallback
const defaultColors = [
    '#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#A855F7',
    '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#84CC16',
];

// --- Seasonal Driver Color Mappings ---
const seasonalDriverColorMap: { [year: string]: { [driverCode: string]: string } } = {
    '2019': {
        // Mercedes
        'HAM': '#00D2BE', 'BOT': '#00D2BE',
        // Ferrari
        'VET': '#DC0000', 'LEC': '#DC0000',
        // Red Bull
        'VER': '#0600EF', 'GAS': '#0600EF',
        // McLaren
        'SAI': '#FF8700', 'NOR': '#FF8700',
        // Renault
        'RIC': '#FFF500', 'HUL': '#FFF500',
        // Toro Rosso
        'KVY': '#2B4562', 'ALB': '#2B4562',
        // Racing Point
        'STR': '#F596C8', 'PER': '#F596C8',
        // Alfa Romeo
        'RAI': '#900000', 'GIO': '#900000',
        // Haas
        'MAG': '#B6BABD', 'GRO': '#B6BABD',
        // Williams
        'RUS': '#FFFFFF', 'KUB': '#FFFFFF',
    },
    '2020': {
        // Mercedes
        'HAM': '#000000', 'BOT': '#000000',
        // Ferrari
        'VET': '#DC0000', 'LEC': '#DC0000',
        // Red Bull
        'VER': '#0600EF', 'ALB': '#0600EF',
        // McLaren
        'SAI': '#FF8700', 'NOR': '#FF8700',
        // Renault
        'RIC': '#FFF500', 'OCO': '#FFF500',
        // AlphaTauri
        'GAS': '#FFFFFF', 'KVY': '#FFFFFF',
        // Racing Point
        'STR': '#F596C8', 'PER': '#F596C8',
        // Alfa Romeo
        'RAI': '#900000', 'GIO': '#900000',
        // Haas
        'MAG': '#B6BABD', 'GRO': '#B6BABD',
        // Williams
        'RUS': '#005AFF', 'LAT': '#005AFF',
    },
    '2021': {
        // Mercedes
        'HAM': '#00D2BE', 'BOT': '#00D2BE',
        // Red Bull
        'VER': '#0600EF', 'PER': '#0600EF',
        // McLaren
        'RIC': '#FF8700', 'NOR': '#FF8700',
        // Aston Martin
        'VET': '#006F62', 'STR': '#006F62',
        // Alpine
        'ALO': '#0090FF', 'OCO': '#0090FF',
        // Ferrari
        'LEC': '#DC0000', 'SAI': '#DC0000',
        // AlphaTauri
        'GAS': '#2B4562', 'TSU': '#2B4562',
        // Alfa Romeo
        'RAI': '#900000', 'GIO': '#900000',
        // Haas
        'MAZ': '#FFFFFF', 'MSC': '#FFFFFF',
        // Williams
        'LAT': '#005AFF', 'RUS': '#005AFF',
    },
    '2022': {
        // Mercedes
        'HAM': '#6CD3BF', 'RUS': '#6CD3BF',
        // Red Bull
        'VER': '#1E5BC6', 'PER': '#1E5BC6',
        // Ferrari
        'LEC': '#ED1C24', 'SAI': '#ED1C24',
        // McLaren
        'NOR': '#F58020', 'RIC': '#F58020',
        // Alpine
        'ALO': '#2293D1', 'OCO': '#2293D1',
        // AlphaTauri
        'GAS': '#4E7C9B', 'TSU': '#4E7C9B',
        // Aston Martin
        'VET': '#2D826D', 'STR': '#2D826D',
        // Williams
        'LAT': '#37BEDD', 'ALB': '#37BEDD',
        // Alfa Romeo
        'ZHO': '#B12039', 'BOT': '#B12039',
        // Haas
        'MAG': '#B6BABD', 'MSC': '#B6BABD',
    },
    '2023': {
        // Red Bull
        'VER': '#3671C6', 'PER': '#3671C6',
        // Ferrari
        'LEC': '#F91536', 'SAI': '#F91536',
        // Mercedes
        'HAM': '#6CD3BF', 'RUS': '#6CD3BF',
        // Alpine
        'OCO': '#2293D1', 'GAS': '#2293D1',
        // McLaren
        'NOR': '#F58020', 'PIA': '#F58020',
        // Alfa Romeo
        'BOT': '#C92D4B', 'ZHO': '#C92D4B',
        // Aston Martin
        'STR': '#358C75', 'ALO': '#358C75',
        // Haas
        'MAG': '#B6BABD', 'HUL': '#B6BABD',
        // AlphaTauri
        'TSU': '#5E8FAA', 'DEV': '#5E8FAA', 'RIC': '#5E8FAA', 'LAW': '#5E8FAA', // Added RIC/LAW for mid-season
        // Williams
        'ALB': '#37BEDD', 'SAR': '#37BEDD',
    },
    '2024': {
        // Red Bull Racing
        'VER': '#3671C6', 'PER': '#3671C6',
        // Mercedes
        'HAM': '#6CD3BF', 'RUS': '#6CD3BF',
        // Ferrari
        'LEC': '#F91536', 'SAI': '#F91536',// Bearman (1 race)
        // McLaren
        'NOR': '#FF8700', 'PIA': '#FF8700',
        // Aston Martin
        'ALO': '#00594F', 'STR': '#00594F',
        // Alpine
        'GAS': '#0090FF', 'OCO': '#0090FF',
        // Williams
        'ALB': '#00A3E0', 'SAR': '#00A3E0', 'COL': '#00A3E0', // Colapinto replaced Sargeant
        // RB (Visa Cash App RB)
        'RIC': '#4E7C9B', 'TSU': '#4E7C9B', 'LAW': '#4E7C9B', // Lawson replaced Ricciardo
        // Stake F1 Team Kick Sauber
        'BOT': '#900000', 'ZHO': '#900000',
        // Haas
        'HUL': '#B6BABD', 'MAG': '#B6BABD', 'BEA': '#B6BABD', // Bearman (1 race)
    },
    // 2025 placeholder
    '2025': { // Based on known 2025 lineup
        // Red Bull Racing
        'VER': '#1E41FF', 'TSU': '#1E41FF', // Assuming RB colors similar to 2022/23
        // Mercedes
        'RUS': '#6CD3BF', 'ANT': '#6CD3BF', // Antonelli
        // Ferrari
        'LEC': '#FF2800', 'HAM': '#FF2800', // Hamilton (Using recent Ferrari red)
        // McLaren
        'NOR': '#FF8700', 'PIA': '#FF8700', // Using recent McLaren orange
        // Aston Martin
        'ALO': '#00594F', 'STR': '#00594F', // Using recent Aston green
        // Alpine
        'GAS': '#0090FF', 'DOO': '#0090FF', 'COL': '#0090FF',  // Doohan (Using recent Alpine blue)
        // Williams
        'ALB': '#00A3E0', 'SAI': '#00A3E0', // Sainz (Using recent Williams blue)
        // RB (Visa Cash App RB)
        'HAD': '#4E7C9B', 'LAW': '#4E7C9B', // Lawson (Using recent AT/RB blue)
        // Sauber / Audi (Using Sauber Red for now)
        'HUL': '#900000', // Hulkenberg
        'BOR': '#900000', // Bortoleto (If confirmed)
        // Haas
        'OCO': '#B6BABD', // Ocon (Using recent Haas gray)
        'BEA': '#B6BABD', // Bearman
    }
};

// Keep track of fallback color index globally or reset it if needed
let fallbackColorIndex = 0;

/**
 * Gets the color associated with a driver for a specific season.
 * @param driverCode The 3-letter driver code (e.g., 'HAM').
 * @param season The year of the season (e.g., 2023).
 * @returns The hex color code string.
 */
export const driverColor = (driverCode: string, season: number | string): string => {
    const year = String(season); // Ensure year is a string for map lookup
    const latestYear = '2025'; // Define the most recent year with data

    // Try to get the color map for the specific season
    const yearMap = seasonalDriverColorMap[year];

    if (yearMap && yearMap[driverCode]) {
        return yearMap[driverCode];
    }

    // Fallback 1: If driver not found in the specific year, check the latest year's map
    // (Handles cases where a driver might be new or data is missing for that year)
    const latestMap = seasonalDriverColorMap[latestYear];
    if (latestMap && latestMap[driverCode]) {
        // console.warn(`Driver ${driverCode} not found for season ${year}, using ${latestYear} color.`);
        return latestMap[driverCode];
    }

    // Fallback 2: Cycle through default colors if no mapping exists in specific or latest year
    // console.warn(`No color mapping found for driver ${driverCode} in season ${year} or ${latestYear}. Using default fallback.`);
    const color = defaultColors[fallbackColorIndex % defaultColors.length];
    fallbackColorIndex++;
    return color;
};
