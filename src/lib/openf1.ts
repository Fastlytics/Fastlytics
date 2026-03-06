/**
 * OpenF1 Integration — Radio Feature (future use)
 *
 * This module is reserved for future integration with the OpenF1 team radio API
 * for use in the Session Replay feature. Driver data is no longer fetched from
 * OpenF1; local images and the existing session drivers API are used instead.
 */

import { logger } from '@/lib/logger';
import { request } from '@/lib/api-client';

export interface OpenF1RadioMessage {
  date: string;
  driver_number: number;
  meeting_key: number;
  recording_url: string;
  session_key: number;
}

/**
 * Fetch team radio messages for a session from the backend proxy.
 */
export const fetchTeamRadio = async (
  sessionKey: string | number = 'latest',
  driverNumber?: number
): Promise<OpenF1RadioMessage[]> => {
  let endpoint = `/api/openf1/radio?session_key=${sessionKey}`;
  if (driverNumber) {
    endpoint += `&driver_number=${driverNumber}`;
  }
  logger.debug(`Fetching team radio from: ${endpoint}`);
  try {
    return await request<OpenF1RadioMessage[]>(endpoint);
  } catch (error) {
    logger.error('Error fetching team radio:', error);
    return [];
  }
};
