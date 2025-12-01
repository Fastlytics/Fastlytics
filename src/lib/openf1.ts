export interface OpenF1Driver {
    broadcast_name: string;
    country_code: string;
    driver_number: number;
    first_name: string;
    full_name: string;
    headshot_url: string;
    last_name: string;
    meeting_key: number;
    name_acronym: string;
    session_key: number;
    team_colour: string;
    team_name: string;
}

const OPENF1_API_BASE_URL = 'https://api.openf1.org/v1';

export const fetchOpenF1Driver = async (driverNumber: number, sessionKey: string | number = 'latest'): Promise<OpenF1Driver | null> => {
    const url = `${OPENF1_API_BASE_URL}/drivers?driver_number=${driverNumber}&session_key=${sessionKey}`;
    console.log(`Fetching OpenF1 driver info from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`OpenF1 API Error: ${response.statusText}`);
            return null;
        }
        const data: OpenF1Driver[] = await response.json();
        if (data && data.length > 0) {
            // Return the last entry as it's likely the most recent/relevant if multiple returned
            return data[data.length - 1];
        }
        return null;
    } catch (error) {
        console.error("Error fetching OpenF1 driver info:", error);
        return null;
    }
};

export const fetchAllOpenF1Drivers = async (sessionKey: string | number = 'latest'): Promise<OpenF1Driver[]> => {
    // Use local backend to leverage caching
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const url = `${API_BASE_URL}/api/openf1/drivers?session_key=${sessionKey}`;
    console.log(`Fetching all OpenF1 drivers from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`OpenF1 API Error: ${response.statusText}`);
            return [];
        }
        const data: OpenF1Driver[] = await response.json();

        // Deduplicate drivers based on driver_number, keeping the latest entry
        const driverMap = new Map<number, OpenF1Driver>();
        data.forEach(driver => {
            driverMap.set(driver.driver_number, driver);
        });

        return Array.from(driverMap.values());
    } catch (error) {
        console.error("Error fetching all OpenF1 drivers:", error);
        return [];
    }
};