import { logger } from '../logger';

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

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  getAccessToken?: () => Promise<string | null>;
}

const isAbortError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name?: unknown }).name === 'AbortError';

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, apiKey, getAccessToken } = config;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  };

  async function request<T>(
    endpoint: string,
    options?: RequestInit & { signal?: AbortSignal }
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    logger.debug(`Fetching: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
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
  }

  return { request };
}
