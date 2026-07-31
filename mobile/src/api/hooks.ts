import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDriverStandings,
  fetchNewsFeed,
  fetchTeamStandings,
  request,
  type NewsFeedParams,
} from '../lib/api';
import { fetchMyProfile, updateMyFavorites, type FavoritesUpdate } from '../lib/profile';
import type { RaceResult, ScheduleEvent } from '@fastlytics/shared';

export function useSchedule(year: number) {
  return useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', year],
    queryFn: () => request<ScheduleEvent[]>(`/api/schedule/${year}`),
  });
}

export function useRaceResults(year: number) {
  return useQuery<RaceResult[]>({
    queryKey: ['raceResults', year],
    queryFn: () => request<RaceResult[]>(`/api/results/races?year=${year}`),
  });
}

export function useDriverStandings(year: number) {
  return useQuery({
    queryKey: ['driverStandings', year],
    queryFn: () => fetchDriverStandings(year),
  });
}

export function useTeamStandings(year: number) {
  return useQuery({
    queryKey: ['teamStandings', year],
    queryFn: () => fetchTeamStandings(year),
  });
}

export function useMyFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'favorites', userId],
    queryFn: () => fetchMyProfile(userId!),
    enabled: !!userId,
  });
}

export function useUpdateFavorites(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: FavoritesUpdate) => updateMyFavorites(userId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'favorites', userId] });
    },
  });
}

const NEWS_PAGE_SIZE = 20;

export function useInfiniteNewsFeed(params?: Omit<NewsFeedParams, 'limit' | 'offset'>) {
  return useInfiniteQuery({
    queryKey: ['news', 'feed', params],
    queryFn: ({ pageParam }) =>
      fetchNewsFeed({ ...params, limit: NEWS_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < NEWS_PAGE_SIZE ? undefined : allPages.length * NEWS_PAGE_SIZE,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardData(year: number) {
  const schedule = useSchedule(year);
  const results = useRaceResults(year);
  const drivers = useDriverStandings(year);
  const teams = useTeamStandings(year);

  return {
    schedule,
    results,
    drivers,
    teams,
    isLoading: schedule.isLoading || results.isLoading || drivers.isLoading || teams.isLoading,
  };
}
