import { TeamStint, MovementIndicator } from '@/lib/types/career-analytics';

interface SeasonInput {
  season: number;
  team?: string;
  races?: number;
  wins?: number;
  podiums?: number;
  points?: number;
  position?: number | null;
}

/**
 * Team color mapping for common F1 teams (hex values).
 * Falls back to a neutral gray for unknown teams.
 */
const TEAM_COLOR_MAP: Record<string, string> = {
  'red bull': '#4781D7',
  ferrari: '#F91536',
  mercedes: '#6CD3BF',
  mclaren: '#F58020',
  'aston martin': '#229971',
  alpine: '#0093CC',
  williams: '#64C4FF',
  haas: '#B6BABD',
  sauber: '#52E252',
  'kick sauber': '#52E252',
  'racing bulls': '#6692FF',
  rb: '#6692FF',
  alphatauri: '#5E8FAA',
  'alfa romeo': '#C92D4B',
  renault: '#FFF500',
  'force india': '#F596C8',
  'racing point': '#F596C8',
  'toro rosso': '#469BFF',
  lotus: '#000000',
  brawn: '#B5F500',
  honda: '#FFFFFF',
  toyota: '#CC0000',
  bmw: '#0066B1',
  jordan: '#EBC94A',
  jaguar: '#006633',
  minardi: '#000000',
  benetton: '#00A651',
};

/**
 * Resolves a team color hex value from a team name.
 */
function resolveTeamColor(teamName: string): string {
  const normalized = teamName.toLowerCase().trim();
  for (const [key, color] of Object.entries(TEAM_COLOR_MAP)) {
    if (normalized.includes(key)) {
      return color;
    }
  }
  return '#666666';
}

/**
 * Extracts non-overlapping team stints from career season data.
 *
 * Groups consecutive seasons with the same team into a single stint.
 * Each stint contains aggregated stats (races, wins, podiums, pointsPerRace)
 * and championship positions for the duration.
 *
 * Input seasons should have: season, races, wins, podiums, points, team, position
 */
export function extractStints(seasons: SeasonInput[]): TeamStint[] {
  if (!seasons || seasons.length === 0) {
    return [];
  }

  // Sort seasons chronologically
  const sorted = [...seasons].sort((a, b) => a.season - b.season);

  const stints: TeamStint[] = [];
  let currentTeam: string | null = null;
  let startYear = 0;
  let endYear = 0;
  let totalRaces = 0;
  let totalWins = 0;
  let totalPodiums = 0;
  let totalPoints = 0;
  let positions: number[] = [];

  for (const season of sorted) {
    const team = season.team || '';

    if (team !== currentTeam) {
      // Flush previous stint
      if (currentTeam !== null) {
        stints.push({
          team: currentTeam,
          teamColor: resolveTeamColor(currentTeam),
          startYear,
          endYear,
          races: totalRaces,
          wins: totalWins,
          podiums: totalPodiums,
          pointsPerRace: totalRaces > 0 ? Math.round((totalPoints / totalRaces) * 100) / 100 : 0,
          positions,
        });
      }

      // Start new stint
      currentTeam = team;
      startYear = season.season;
      endYear = season.season;
      totalRaces = season.races || 0;
      totalWins = season.wins || 0;
      totalPodiums = season.podiums || 0;
      totalPoints = season.points || 0;
      positions = season.position != null ? [season.position] : [];
    } else {
      // Continue current stint
      endYear = season.season;
      totalRaces += season.races || 0;
      totalWins += season.wins || 0;
      totalPodiums += season.podiums || 0;
      totalPoints += season.points || 0;
      if (season.position != null) {
        positions.push(season.position);
      }
    }
  }

  // Flush last stint
  if (currentTeam !== null) {
    stints.push({
      team: currentTeam,
      teamColor: resolveTeamColor(currentTeam),
      startYear,
      endYear,
      races: totalRaces,
      wins: totalWins,
      podiums: totalPodiums,
      pointsPerRace: totalRaces > 0 ? Math.round((totalPoints / totalRaces) * 100) / 100 : 0,
      positions,
    });
  }

  return stints;
}

/**
 * Classifies the movement direction between two consecutive team stints.
 *
 * Logic:
 * - If PPR_before == 0 and PPR_after > 0: "improved"
 * - If PPR_before == 0 and PPR_after == 0: "lateral"
 * - Otherwise: compute percentChange = ((PPR_after - PPR_before) / PPR_before) * 100
 *   - percentChange > 10: "improved"
 *   - percentChange < -10: "declined"
 *   - else: "lateral"
 */
export function classifyMovement(stintBefore: TeamStint, stintAfter: TeamStint): MovementIndicator {
  const pprBefore = stintBefore.pointsPerRace;
  const pprAfter = stintAfter.pointsPerRace;

  let direction: 'improved' | 'declined' | 'lateral';

  if (pprBefore === 0) {
    direction = pprAfter > 0 ? 'improved' : 'lateral';
  } else {
    const percentChange = ((pprAfter - pprBefore) / pprBefore) * 100;
    if (percentChange > 10) {
      direction = 'improved';
    } else if (percentChange < -10) {
      direction = 'declined';
    } else {
      direction = 'lateral';
    }
  }

  return {
    from: stintBefore.team,
    to: stintAfter.team,
    direction,
  };
}

/**
 * Analyzes all consecutive stint pairs and classifies each movement.
 *
 * Returns an array of MovementIndicators for each team transition.
 * If there are N stints, returns N-1 movement indicators.
 */
export function analyzeMovements(stints: TeamStint[]): MovementIndicator[] {
  if (!stints || stints.length < 2) {
    return [];
  }

  const movements: MovementIndicator[] = [];

  for (let i = 0; i < stints.length - 1; i++) {
    movements.push(classifyMovement(stints[i], stints[i + 1]));
  }

  return movements;
}
