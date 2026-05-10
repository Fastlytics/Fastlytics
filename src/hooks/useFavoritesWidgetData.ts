// knip-ignore
import { useMemo } from 'react';
import type { DriverStanding, TeamStanding, ScheduleEvent } from '@/lib/api';
import type { Profile } from '@/contexts/AuthContext';
import { getCurrentSeasonYear } from '@/lib/seasonUtils';

export interface RivalDriver {
  driver: DriverStanding;
  label: string;
  status: string;
  type: 'leader' | 'ahead' | 'you' | 'behind' | 'rival';
}

export interface DriverRivals {
  isTitleContender: boolean;
  displayDrivers: RivalDriver[];
  gapToLeader: number;
}

export interface FavoritesWidgetData {
  favoriteDriver: DriverStanding | null;
  favoriteTeam: TeamStanding | null;
  remainingPoints: number;
  driverRivals: DriverRivals | null;
}

export function useFavoritesWidgetData(
  profile: Profile | null,
  drivers: DriverStanding[],
  teams: TeamStanding[],
  schedule: ScheduleEvent[]
): FavoritesWidgetData {
  const favoriteDriver = useMemo(() => {
    if (!profile?.favorite_driver || !drivers.length) return null;
    return (
      drivers.find(
        (d) =>
          d.code === profile.favorite_driver ||
          d.name.toLowerCase().includes(profile.favorite_driver.toLowerCase())
      ) ?? null
    );
  }, [profile, drivers]);

  const favoriteTeam = useMemo(() => {
    if (!profile?.favorite_team || !teams.length) return null;
    return (
      teams.find(
        (t) =>
          t.team === profile.favorite_team ||
          t.team.toLowerCase().includes(profile.favorite_team.toLowerCase())
      ) ?? null
    );
  }, [profile, teams]);

  const remainingPoints = useMemo(() => {
    if (!schedule?.length) return 0;
    const now = new Date();
    let points = 0;
    const seasonYear = schedule[0]?.EventDate
      ? new Date(schedule[0].EventDate).getFullYear()
      : getCurrentSeasonYear();
    const hasFastestLap = seasonYear >= 2019 && seasonYear <= 2024;
    const raceMax = hasFastestLap ? 26 : 25;

    schedule.forEach((event) => {
      const raceDate = event.Session5Date
        ? new Date(event.Session5Date)
        : event.EventDate
          ? new Date(event.EventDate)
          : null;
      if (raceDate && raceDate > now) points += raceMax;
      if (event.EventFormat.toLowerCase().includes('sprint')) {
        const sessions = [
          { name: event.Session1, date: event.Session1Date },
          { name: event.Session2, date: event.Session2Date },
          { name: event.Session3, date: event.Session3Date },
          { name: event.Session4, date: event.Session4Date },
          { name: event.Session5, date: event.Session5Date },
        ];
        const sprint = sessions.find((s) => s.name?.toLowerCase() === 'sprint');
        if (sprint?.date && new Date(sprint.date) > now) points += 8;
        else if (raceDate && raceDate > now) points += 8;
      }
    });
    return points;
  }, [schedule]);

  const driverRivals = useMemo((): DriverRivals | null => {
    if (!favoriteDriver) return null;
    const index = drivers.findIndex((d) => d === favoriteDriver);
    const leader = drivers[0];
    const isTitleContender =
      leader.points > 0 && leader.points - favoriteDriver.points <= remainingPoints;

    const getRivalryStatus = (rival: DriverStanding | null) => {
      if (!rival) return 'none';
      return Math.abs(favoriteDriver.points - rival.points) > remainingPoints
        ? 'confirmed'
        : 'active';
    };

    let displayDrivers: RivalDriver[] = [];

    if (isTitleContender) {
      const contenders = drivers.filter((d) => leader.points - d.points <= remainingPoints);
      const ci = contenders.findIndex((d) => d.code === favoriteDriver.code);
      if (ci === 0) {
        displayDrivers = [
          { driver: favoriteDriver, label: 'LEADER', status: 'active', type: 'you' },
          ...(contenders[1]
            ? [{ driver: contenders[1], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
          ...(contenders[2]
            ? [{ driver: contenders[2], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else if (ci === 1) {
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
          ...(contenders[2]
            ? [{ driver: contenders[2], label: 'RIVAL', status: 'active', type: 'rival' as const }]
            : []),
        ];
      } else {
        displayDrivers = [
          { driver: contenders[0], label: 'LEADER', status: 'active', type: 'leader' },
          { driver: contenders[ci - 1], label: 'AHEAD', status: 'active', type: 'ahead' },
          { driver: favoriteDriver, label: 'CONTENDER', status: 'active', type: 'you' },
        ];
      }
    } else {
      const ahead = index > 0 ? drivers[index - 1] : null;
      const behind = index < drivers.length - 1 ? drivers[index + 1] : null;
      if (ahead)
        displayDrivers.push({
          driver: ahead,
          label: getRivalryStatus(ahead) === 'confirmed' ? 'LOCKED' : 'AHEAD',
          status: getRivalryStatus(ahead),
          type: 'ahead',
        });
      displayDrivers.push({
        driver: favoriteDriver,
        label: 'YOUR FAV',
        status: 'active',
        type: 'you',
      });
      if (behind)
        displayDrivers.push({
          driver: behind,
          label: getRivalryStatus(behind) === 'confirmed' ? 'SAFE' : 'BEHIND',
          status: getRivalryStatus(behind),
          type: 'behind',
        });
    }

    return {
      isTitleContender,
      displayDrivers,
      gapToLeader: index >= 0 ? favoriteDriver.points - drivers[0].points : 0,
    };
  }, [favoriteDriver, drivers, remainingPoints]);

  return { favoriteDriver, favoriteTeam, remainingPoints, driverRivals };
}
