import { createApiClient } from '@fastlytics/shared';
import type {
  ChampionshipProgressionData,
  DriverStanding,
  LapTimesEnrichedResponse,
  SectorComparisonData,
  TeamStanding,
  TireStrategyResponse,
} from '@fastlytics/shared';
import { getAccessToken, supabase } from './supabase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://fastlytics-api-proxy-v2.subhashgottumukkala17.workers.dev';
const API_KEY = process.env.EXPO_PUBLIC_FASTLYTICS_API_KEY;

export const { request } = createApiClient({
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  getAccessToken,
});

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  return search.toString();
};

export const fetchDriverStandings = (year: number) =>
  request<DriverStanding[]>(`/api/standings/drivers?${toQueryString({ year })}`);

export const fetchTeamStandings = (year: number) =>
  request<TeamStanding[]>(`/api/standings/teams?${toQueryString({ year })}`);

export const fetchChampionshipProgression = (year: number) =>
  request<ChampionshipProgressionData>(`/api/standings/progression?${toQueryString({ year })}`);

export interface NewsArticle {
  id: string;
  source_name: string;
  source_url: string;
  rewritten_title: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  drivers: string[];
  teams: string[];
  categories: string[];
}

export interface NewsFeedParams {
  limit?: number;
  offset?: number;
  driver?: string;
  team?: string;
}

export async function fetchNewsFeed(params: NewsFeedParams = {}): Promise<NewsArticle[]> {
  const offset = params.offset ?? 0;
  const limit = params.limit ?? 20;
  let query = supabase
    .from('news_articles')
    .select(
      'id, source_name, source_url, rewritten_title, summary, image_url, published_at, drivers, teams, categories'
    );

  if (params.driver && params.team) {
    query = query.or(`drivers.cs.{"${params.driver}"},teams.cs.{"${params.team}"}`);
  } else if (params.driver) {
    query = query.contains('drivers', [params.driver]);
  } else if (params.team) {
    query = query.contains('teams', [params.team]);
  }

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((article) => ({
    ...article,
    drivers: Array.isArray(article.drivers) ? article.drivers : [],
    teams: Array.isArray(article.teams) ? article.teams : [],
    categories: Array.isArray(article.categories) ? article.categories : [],
  }));
}

export const fetchTireStrategy = (year: number, event: string, session: string) =>
  request<TireStrategyResponse>(`/api/strategy?${toQueryString({ year, event, session })}`);

export const fetchLapTimes = (year: number, event: string, session: string, driver: string) => {
  const search = new URLSearchParams(toQueryString({ year, event, session }));
  search.append('drivers', driver);

  return request<LapTimesEnrichedResponse>(`/api/laptimes?${search.toString()}`);
};

export const fetchSectorComparison = (
  year: number,
  event: string,
  session: string,
  driver1: string,
  driver2: string
) =>
  request<SectorComparisonData>(
    `/api/comparison/sectors?${toQueryString({
      year,
      event,
      session,
      driver1,
      driver2,
      lap1: 'fastest',
      lap2: 'fastest',
    })}`
  );

export type TelemetryMetric = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gear';

export interface TelemetrySeriesPoint {
  distance: number;
  value: number;
}

type TelemetryRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is TelemetryRecord =>
  typeof value === 'object' && value !== null;

const numericValue = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const getTelemetryRecords = (payload: unknown, metric: TelemetryMetric): TelemetryRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const collection = metric === 'speed' ? payload.trace : payload.points;
  return Array.isArray(collection) ? collection.filter(isRecord) : [];
};

const telemetryValueKey: Record<TelemetryMetric, string> = {
  speed: 'Speed',
  throttle: 'Throttle',
  brake: 'Brake',
  rpm: 'RPM',
  drs: 'DRS',
  gear: 'nGear',
};

export async function fetchTelemetrySeries(
  year: number,
  event: string,
  session: string,
  driver: string,
  lap: string,
  metric: TelemetryMetric
): Promise<TelemetrySeriesPoint[]> {
  const payload = await request<unknown>(
    `/api/telemetry/${metric}?${toQueryString({
      year,
      event,
      session,
      driver,
      lap,
    })}`
  );

  return getTelemetryRecords(payload, metric).flatMap((record, index) => {
    const value = numericValue(record[telemetryValueKey[metric]]);
    if (value === null) {
      return [];
    }

    const distance =
      numericValue(record.Distance) ??
      numericValue(record.distance) ??
      numericValue(record.X) ??
      index;

    return [{ distance, value }];
  });
}
