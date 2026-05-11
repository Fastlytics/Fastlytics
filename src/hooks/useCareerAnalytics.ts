import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/api-client';
import type {
  TeammateSeasonData,
  RaceResult,
  Milestone,
  EraMetadata,
  FingerprintResponse,
} from '@/lib/types/career-analytics';

/**
 * Shared query options for all career analytics endpoints.
 * - staleTime: 5 minutes (data doesn't change frequently)
 * - gcTime: 30 minutes (keep in cache for navigation)
 * - retry: 2 attempts on failure
 * - retryDelay: 1 second between retries
 */
const ANALYTICS_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  retryDelay: 1000,
} as const;

/**
 * Fetches season-by-season teammate head-to-head comparison data for a driver.
 */
export function useTeammateComparison(slug: string) {
  return useQuery<TeammateSeasonData[]>({
    queryKey: ['teammateComparison', slug],
    queryFn: () =>
      request<TeammateSeasonData[]>(`/api/driver/${encodeURIComponent(slug)}/teammate-comparison`),
    enabled: !!slug,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

/**
 * Fetches chronological per-race results for all career races of a driver.
 */
export function useRaceResults(slug: string) {
  return useQuery<RaceResult[]>({
    queryKey: ['raceResults', slug],
    queryFn: () => request<RaceResult[]>(`/api/driver/${encodeURIComponent(slug)}/race-results`),
    enabled: !!slug,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

/**
 * Fetches computed career milestones for a driver or team.
 */
export function useMilestones(slug: string, entityType: 'driver' | 'team') {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', entityType, slug],
    queryFn: () =>
      request<Milestone[]>(`/api/${entityType}/${encodeURIComponent(slug)}/milestones`),
    enabled: !!slug,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

/**
 * Fetches historical F1 season metadata for era normalization.
 * No slug needed — this is reference data shared across all entities.
 */
export function useEraMetadata() {
  return useQuery<EraMetadata[]>({
    queryKey: ['eraMetadata'],
    queryFn: () => request<EraMetadata[]>('/api/era-metadata'),
    ...ANALYTICS_QUERY_OPTIONS,
  });
}

/**
 * Fetches pre-computed driving style fingerprint scores for a driver.
 */
export function useDrivingFingerprint(slug: string) {
  return useQuery<FingerprintResponse>({
    queryKey: ['drivingFingerprint', slug],
    queryFn: () =>
      request<FingerprintResponse>(`/api/driver/${encodeURIComponent(slug)}/driving-fingerprint`),
    enabled: !!slug,
    ...ANALYTICS_QUERY_OPTIONS,
  });
}
