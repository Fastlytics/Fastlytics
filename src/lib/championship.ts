import { ScheduleEvent, RaceResult } from './api';

// Points constants
const POINTS_RACE_WIN = 25;
const POINTS_FASTEST_LAP = 1;
const POINTS_SPRINT_WIN = 8;

export const calculateRemainingPoints = (
    schedule: ScheduleEvent[],
    completedRaces: RaceResult[],
    type: 'driver' | 'team',
    year: number
): number => {
    if (!schedule || !completedRaces) return 0;

    // Fastest lap point rule: Available 2019-2024
    const hasFastestLapPoint = year >= 2019 && year <= 2024;
    const pointsFastestLap = hasFastestLapPoint ? 1 : 0;

    // Driver Max Points
    const maxDriverPointsRegular = POINTS_RACE_WIN + pointsFastestLap;
    const maxDriverPointsSprint = maxDriverPointsRegular + POINTS_SPRINT_WIN;

    // Team Max Points (1-2 finish)
    // Regular: 25 + 18 + FL = 43 + FL
    const maxTeamPointsRegular = 43 + pointsFastestLap;
    // Sprint: 8 + 7 = 15 (Sprint points are fixed for top 8)
    const maxTeamPointsSprint = maxTeamPointsRegular + 15;

    // Find remaining events
    const lastCompletedRound = completedRaces.length > 0
        ? Math.max(...completedRaces.map(r => r.round))
        : 0;

    const remainingEvents = schedule.filter(event => event.RoundNumber > lastCompletedRound);

    let maxRemainingPoints = 0;

    remainingEvents.forEach(event => {
        const isSprint = event.EventFormat === 'sprint' || event.EventFormat === 'sprint_shootout';

        if (type === 'driver') {
            maxRemainingPoints += isSprint ? maxDriverPointsSprint : maxDriverPointsRegular;
        } else {
            maxRemainingPoints += isSprint ? maxTeamPointsSprint : maxTeamPointsRegular;
        }
    });

    return maxRemainingPoints;
};

export const getChampionshipStatus = (
    p1Points: number,
    p2Points: number,
    remainingPoints: number
): 'champion' | 'leader' => {
    if (p1Points - p2Points > remainingPoints) {
        return 'champion';
    }
    return 'leader';
};
