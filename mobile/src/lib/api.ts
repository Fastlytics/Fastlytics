import { createApiClient } from '@fastlytics/shared';
import { getAccessToken } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const API_KEY = process.env.EXPO_PUBLIC_FASTLYTICS_API_KEY;

export const { request } = createApiClient({
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  getAccessToken,
});
