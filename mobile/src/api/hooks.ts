import { useQuery } from '@tanstack/react-query';
import { request } from '../lib/api';
import type {
  ScheduleEvent,
  DriverStanding,
  TeamStanding,
  RaceResult,
} from '@fastlytics/shared';

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
  return useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', year],
    queryFn: () => request<DriverStanding[]>(`/api/standings/drivers?year=${year}`),
  });
}

export function useTeamStandings(year: number) {
  return useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', year],
    queryFn: () => request<TeamStanding[]>(`/api/standings/teams?year=${year}`),
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
