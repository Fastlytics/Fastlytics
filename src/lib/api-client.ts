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
import { getAccessToken } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_FASTLYTICS_API_KEY;
const API_KEY_HEADER = 'X-API-Key';

const getHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers[API_KEY_HEADER] = API_KEY;
  }
  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const isAbortError = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
};

export const request = async <T>(
  endpoint: string,
  options?: RequestInit & { signal?: AbortSignal }
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  logger.debug(`Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal,
      headers: {
        ...(await getHeaders()),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          errorDetail = errorData.detail;
        } else if (errorData.detail != null) {
          errorDetail = JSON.stringify(errorData.detail);
        } else if (typeof errorData.message === 'string') {
          errorDetail = errorData.message;
        } else if (errorData != null) {
          errorDetail = JSON.stringify(errorData);
        }
      } catch {
        /* Ignore */
      }
      logger.error(`API Error: ${errorDetail}`);
      throw new APIError(response.status, errorDetail);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    if (isAbortError(error) || options?.signal?.aborted) throw error;
    logger.error(`Network or Parsing Error:`, error);
    throw error;
  }
};
