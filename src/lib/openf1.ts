import { logger } from '@/lib/logger';
import { request } from '@/lib/api-client';

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

export const fetchOpenF1Driver = async (
  driverNumber: number,
  sessionKey: string | number = 'latest'
): Promise<OpenF1Driver | null> => {
  const url = `${OPENF1_API_BASE_URL}/drivers?driver_number=${driverNumber}&session_key=${sessionKey}`;
  logger.debug(`Fetching OpenF1 driver info from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.error(`OpenF1 API Error: ${response.statusText}`);
      return null;
    }
    const data: OpenF1Driver[] = await response.json();
    if (data && data.length > 0) {
      // Return the last entry as it's likely the most recent/relevant if multiple returned
      return data[data.length - 1];
    }
    return null;
  } catch (error) {
    logger.error('Error fetching OpenF1 driver info:', error);
    return null;
  }
};

export const fetchAllOpenF1Drivers = async (
  sessionKey: string | number = 'latest',
  year?: number
): Promise<OpenF1Driver[]> => {
  let endpoint = `/api/openf1/drivers?session_key=${sessionKey}`;
  if (year) {
    endpoint += `&year=${year}`;
  }
  logger.debug(`Fetching all OpenF1 drivers from: ${endpoint}`);
  try {
    const data = await request<OpenF1Driver[]>(endpoint);

    // Deduplicate drivers based on driver_number, keeping the latest entry
    const driverMap = new Map<number, OpenF1Driver>();
    data.forEach((driver) => {
      driverMap.set(driver.driver_number, driver);
    });

    return Array.from(driverMap.values());
  } catch (error) {
    logger.error('Error fetching all OpenF1 drivers:', error);
    return [];
  }
};
