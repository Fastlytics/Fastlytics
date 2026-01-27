export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_FASTLYTICS_API_KEY;
const API_KEY_HEADER = 'X-API-Key';

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers[API_KEY_HEADER] = API_KEY;
  } else {
    // Optional: warn only once or in specific env?
    // console.warn("VITE_FASTLYTICS_API_KEY is not set.");
  }
  return headers;
};

export const request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  // Remove leading slash if present in endpoint to avoid double slashes if base url has one?
  // Usually standardizing on no trailing slash in base, leading slash in endpoint.
  const url = `${API_BASE_URL}${endpoint}`;
  logger.debug(`Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch {
        /* Ignore */
      }
      logger.error(`API Error: ${errorDetail}`);
      throw new APIError(response.status, errorDetail);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    logger.error(`Network or Parsing Error:`, error);
    throw error;
  }
};
