import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const CURRENT_SEASON = 2026;

interface RoundData {
  id: number;
  number: number;
  name: string;
  date: string;
  season_id: number;
}

type SyncMode = 'all' | 'race' | 'sprint' | 'qualifying' | 'sprint-qualifying';

interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: { driverId: string; code: string; permanentNumber: string };
  Constructor: { constructorId: string; name: string };
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: { rank: string; lap: string; Time: { time: string } };
}

interface JolpicaQualifyingResult {
  number: string;
  position: string;
  Driver: { driverId: string; code: string; permanentNumber: string };
  Constructor: { constructorId: string; name: string };
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

interface JolpicaSprintResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: { driverId: string; code: string; permanentNumber: string };
  Constructor: { constructorId: string; name: string };
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: { rank: string; lap: string; Time: { time: string } };
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const forceRound = url.searchParams.get('round');
    const mode = (url.searchParams.get('mode') || 'all') as SyncMode;

    // Find rounds to process
    let rounds: RoundData[];

    if (forceRound) {
      const { data: round } = await client
        .from('f1_rounds')
        .select(`id, number, name, date, season_id, f1_seasons!inner(year)`)
        .eq('f1_seasons.year', CURRENT_SEASON)
        .eq('number', parseInt(forceRound))
        .single();

      if (!round) {
        return new Response(
          JSON.stringify({ error: `Round ${forceRound} not found for season ${CURRENT_SEASON}` }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      rounds = [round];
    } else {
      // Default: find past rounds
      const { data } = await client
        .from('f1_rounds')
        .select(`id, number, name, date, season_id, f1_seasons!inner(year)`)
        .eq('f1_seasons.year', CURRENT_SEASON)
        .not('number', 'is', null)
        .lte('date', new Date().toISOString().split('T')[0])
        .order('number', { ascending: true });

      if (!data || data.length === 0) {
        return new Response(JSON.stringify({ message: 'No past rounds found' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      rounds = data;
    }

    const synced: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const round of rounds) {
      try {
        const result = await handleRound(client, round, CURRENT_SEASON, mode);
        if (result.synced.length > 0) synced.push(...result.synced);
        if (result.skipped.length > 0) skipped.push(...result.skipped);
        if (result.errors.length > 0) errors.push(...result.errors);
      } catch (e) {
        errors.push(`Round ${round.number}: ${round.name} - ${e.message}`);
      }
    }

    if (synced.length > 0) {
      const { error: refreshError } = await client.rpc('refresh_driver_achievements');
      if (refreshError) {
        errors.push(`Failed to refresh driver achievements view: ${refreshError.message}`);
      }
    }

    return new Response(JSON.stringify({ synced, skipped, errors }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DBClient = any;

async function handleRound(
  client: DBClient,
  round: RoundData,
  season: number,
  mode: SyncMode
): Promise<{ synced: string[]; skipped: string[]; errors: string[] }> {
  const synced: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  const roundNumber = round.number;

  // Ensure round entries exist (needed for any session sync)
  const codeToRoundEntryId = await ensureRoundEntries(client, round, season);
  if (!codeToRoundEntryId || codeToRoundEntryId.size === 0) {
    errors.push(`Round ${roundNumber}: ${round.name} - failed to create round entries`);
    return { synced, skipped, errors };
  }

  // Sync based on mode
  if (mode === 'all' || mode === 'race') {
    try {
      const raceSessionId = await getSessionId(client, round.id, 'R');
      if (raceSessionId) {
        const { data: existing } = await client
          .from('f1_session_entries')
          .select('id')
          .eq('session_id', raceSessionId)
          .limit(1);

        if (!existing || existing.length === 0) {
          await syncRaceEntries(client, round, season, raceSessionId, codeToRoundEntryId);
          synced.push(`Round ${roundNumber}: ${round.name} (race)`);
        } else {
          skipped.push(`Round ${roundNumber}: ${round.name} (race already synced)`);
        }

        // Recompute championship standings after this round
        try {
          await syncChampionships(client, round, season, raceSessionId);
          synced.push(`Round ${roundNumber}: ${round.name} (championships)`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Round ${roundNumber}: ${round.name} (championships) - ${msg}`);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Round ${roundNumber}: ${round.name} (race) - ${msg}`);
    }
  }

  if (mode === 'all' || mode === 'sprint' || mode === 'sprint-qualifying') {
    try {
      const sprintSessionId = await getSessionId(client, round.id, 'SR');
      if (sprintSessionId) {
        const { data: existing } = await client
          .from('f1_session_entries')
          .select('id')
          .eq('session_id', sprintSessionId)
          .limit(1);

        if (!existing || existing.length === 0) {
          const ok = await doSyncSprint(
            client,
            roundNumber,
            round.id,
            season,
            sprintSessionId,
            codeToRoundEntryId
          );
          if (ok) synced.push(`Round ${roundNumber}: ${round.name} (sprint)`);
          else skipped.push(`Round ${roundNumber}: ${round.name} (sprint no data)`);
        } else {
          skipped.push(`Round ${roundNumber}: ${round.name} (sprint already synced)`);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Round ${roundNumber}: ${round.name} (sprint) - ${msg}`);
    }
  }

  if (mode === 'all' || mode === 'qualifying' || mode === 'sprint-qualifying') {
    try {
      const q3SessionId = await getSessionId(client, round.id, 'Q3');
      if (q3SessionId) {
        const { data: existing } = await client
          .from('f1_session_entries')
          .select('id')
          .eq('session_id', q3SessionId)
          .limit(1);

        if (!existing || existing.length === 0) {
          const ok = await doSyncQualifying(
            client,
            roundNumber,
            round.id,
            season,
            q3SessionId,
            codeToRoundEntryId
          );
          if (ok) synced.push(`Round ${roundNumber}: ${round.name} (qualifying)`);
          else skipped.push(`Round ${roundNumber}: ${round.name} (qualifying no data)`);
        } else {
          skipped.push(`Round ${roundNumber}: ${round.name} (qualifying already synced)`);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Round ${roundNumber}: ${round.name} (qualifying) - ${msg}`);
    }
  }

  return { synced, skipped, errors };
}

async function ensureRoundEntries(
  client: DBClient,
  round: RoundData,
  season: number
): Promise<Map<string, number> | null> {
  const roundId = round.id;
  const seasonId = round.season_id;

  // Check if already exist
  const { data: existing } = await client
    .from('f1_round_entries')
    .select('id')
    .eq('round_id', roundId)
    .limit(1);

  if (existing && existing.length > 0) {
    // Rebuild the map
    const { data: entries } = await client
      .from('f1_round_entries')
      .select(
        `id, team_driver_id, f1_team_drivers!inner(driver_id, f1_drivers!inner(abbreviation))`
      )
      .eq('round_id', roundId);

    const map = new Map<string, number>();
    if (entries) {
      for (const e of entries) {
        const code = e.f1_team_drivers?.f1_drivers?.abbreviation;
        if (code) map.set(code, e.id);
      }
    }
    return map;
  }

  // Get the driver->team mapping for this season
  const { data: teamDrivers } = await client
    .from('f1_team_drivers')
    .select(`id, driver_id, f1_drivers!inner(abbreviation, permanent_car_number)`)
    .eq('season_id', seasonId);

  if (!teamDrivers || teamDrivers.length === 0) return null;

  let nextId = await getNextId(client, 'f1_round_entries');
  const entries: Record<string, unknown>[] = [];
  const map = new Map<string, number>();

  for (const td of teamDrivers) {
    const code = td.f1_drivers?.abbreviation;
    const carNumber = parseInt(td.f1_drivers?.permanent_car_number) || 0;
    if (!code) continue;

    const id = nextId++;
    map.set(code, id);
    entries.push({
      id,
      api_id: `roundentry_${season}_${round.number}_${code}`,
      car_number: carNumber,
      round_id: roundId,
      team_driver_id: td.id,
    });
  }

  if (entries.length > 0) {
    const { error } = await client.from('f1_round_entries').upsert(entries, { onConflict: 'id' });
    if (error) {
      console.error(`Failed to insert round entries: ${error.message}`);
      return null;
    }
  }

  return map;
}

async function syncRaceEntries(
  client: DBClient,
  round: RoundData,
  season: number,
  raceSessionId: number,
  codeToRoundEntryId: Map<string, number>
) {
  const roundNumber = round.number;
  const roundId = round.id;

  const resp = await fetch(`${JOLPICA_BASE}/${season}/${roundNumber}/results.json?limit=100`);
  if (!resp.ok) throw new Error(`Jolpica race API returned ${resp.status}`);
  const data = await resp.json();
  const races = data?.MRData?.RaceTable?.Races;
  if (!races || races.length === 0 || !races[0].Results || races[0].Results.length === 0) {
    throw new Error('No race results available yet from jolpica');
  }
  const raceResults: JolpicaResult[] = races[0].Results;

  let nextId = await getNextId(client, 'f1_session_entries');
  const entries: Record<string, unknown>[] = [];

  for (const result of raceResults) {
    const code = result.Driver.code;
    const roundEntryId = codeToRoundEntryId.get(code);
    if (!roundEntryId) continue;

    const position = parseInt(result.position);
    const grid = parseInt(result.grid);
    const laps = parseInt(result.laps);
    const points = parseFloat(result.points);
    const status = result.status;
    const isFinished = status === 'Finished';
    const isLapped = status.includes('Lap') || status === 'Lapped';
    const isClassified = isFinished || isLapped;
    const fastestLapRank = result.FastestLap ? parseInt(result.FastestLap.rank) : null;
    const timeStr = result.Time?.time || null;

    let detail: string;
    if (isFinished) detail = 'Finished';
    else if (isLapped) detail = 'Lapped';
    else detail = 'Retired';

    entries.push({
      id: nextId++,
      api_id: `se_${season}_${roundNumber}_R_${code}`,
      detail,
      fastest_lap_rank: fastestLapRank,
      grid,
      is_classified: isClassified,
      is_eligible_for_points: true,
      laps_completed: laps,
      points,
      position,
      round_entry_id: roundEntryId,
      session_id: raceSessionId,
      status: null,
      time: timeStr,
    });
  }

  if (entries.length > 0) {
    const { error } = await client.from('f1_session_entries').upsert(entries, { onConflict: 'id' });
    if (error) throw new Error(`Failed to insert race session entries: ${error.message}`);
    await client.from('f1_sessions').update({ has_time_data: true }).eq('id', raceSessionId);
  }
}

async function getSessionId(
  client: DBClient,
  roundId: number,
  type: string
): Promise<number | null> {
  const { data } = await client
    .from('f1_sessions')
    .select('id')
    .eq('round_id', roundId)
    .eq('type', type)
    .single();
  return data?.id || null;
}

async function getNextId(client: DBClient, table: string): Promise<number> {
  const { data } = await client.from(table).select('id').order('id', { ascending: false }).limit(1);
  return data && data.length > 0 ? data[0].id + 1 : 1;
}

async function doSyncSprint(
  client: DBClient,
  roundNumber: number,
  roundId: number,
  season: number,
  sprintSessionId: number,
  codeToRoundEntryId: Map<string, number>
): Promise<boolean> {
  try {
    const resp = await fetch(`${JOLPICA_BASE}/${season}/${roundNumber}/sprint.json?limit=100`);
    if (!resp.ok) return false;
    const data = await resp.json();
    const races = data?.MRData?.RaceTable?.Races;
    if (
      !races ||
      races.length === 0 ||
      !races[0].SprintResults ||
      races[0].SprintResults.length === 0
    )
      return false;

    const sprintResults: JolpicaSprintResult[] = races[0].SprintResults;
    let nextId = await getNextId(client, 'f1_session_entries');
    const entries: Record<string, unknown>[] = [];

    for (const result of sprintResults) {
      const code = result.Driver.code;
      const roundEntryId = codeToRoundEntryId.get(code);
      if (!roundEntryId) continue;

      const status = result.status;
      const isFinished = status === 'Finished';
      const isLapped = status.includes('Lap') || status === 'Lapped';
      const isClassified = isFinished || isLapped;
      const detail = isFinished ? 'Finished' : isLapped ? 'Lapped' : 'Retired';

      entries.push({
        id: nextId++,
        api_id: `se_${season}_${roundNumber}_SR_${code}`,
        detail,
        fastest_lap_rank: result.FastestLap ? parseInt(result.FastestLap.rank) : null,
        grid: parseInt(result.grid),
        is_classified: isClassified,
        is_eligible_for_points: true,
        laps_completed: parseInt(result.laps),
        points: parseFloat(result.points),
        position: parseInt(result.position),
        round_entry_id: roundEntryId,
        session_id: sprintSessionId,
        status: null,
        time: result.Time?.time || null,
      });
    }

    if (entries.length > 0) {
      const { error } = await client
        .from('f1_session_entries')
        .upsert(entries, { onConflict: 'id' });
      if (error) throw new Error(`Failed to insert sprint entries: ${error.message}`);
      await client.from('f1_sessions').update({ has_time_data: true }).eq('id', sprintSessionId);
      return true;
    }
    return false;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`Sprint sync failed for round ${roundNumber}: ${msg}`);
    return false;
  }
}

async function doSyncQualifying(
  client: DBClient,
  roundNumber: number,
  roundId: number,
  season: number,
  q3SessionId: number,
  codeToRoundEntryId: Map<string, number>
): Promise<boolean> {
  try {
    const resp = await fetch(`${JOLPICA_BASE}/${season}/${roundNumber}/qualifying.json?limit=100`);
    if (!resp.ok) return false;
    const data = await resp.json();
    const races = data?.MRData?.RaceTable?.Races;
    if (
      !races ||
      races.length === 0 ||
      !races[0].QualifyingResults ||
      races[0].QualifyingResults.length === 0
    )
      return false;

    const qualResults: JolpicaQualifyingResult[] = races[0].QualifyingResults;
    let nextId = await getNextId(client, 'f1_session_entries');
    const entries: Record<string, unknown>[] = [];

    for (const result of qualResults) {
      const code = result.Driver.code;
      const roundEntryId = codeToRoundEntryId.get(code);
      if (!roundEntryId) continue;

      entries.push({
        id: nextId++,
        api_id: `se_${season}_${roundNumber}_Q3_${code}`,
        detail: 'Finished',
        fastest_lap_rank: null,
        grid: null,
        is_classified: true,
        is_eligible_for_points: false,
        laps_completed: null,
        points: 0,
        position: parseInt(result.position),
        round_entry_id: roundEntryId,
        session_id: q3SessionId,
        status: null,
        time: result.Q3 || result.Q2 || result.Q1 || null,
      });
    }

    if (entries.length > 0) {
      const { error } = await client
        .from('f1_session_entries')
        .upsert(entries, { onConflict: 'id' });
      if (error) throw new Error(`Failed to insert qualifying entries: ${error.message}`);
      await client.from('f1_sessions').update({ has_time_data: true }).eq('id', q3SessionId);
      return true;
    }
    return false;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`Qualifying sync failed for round ${roundNumber}: ${msg}`);
    return false;
  }
}

async function syncChampionships(
  client: DBClient,
  round: RoundData,
  season: number,
  raceSessionId: number
): Promise<void> {
  // Get all race and sprint session IDs for the season up to and including this round
  const { data: raceSessions, error: sessionsError } = await client
    .from('f1_sessions')
    .select('id, type, f1_rounds!inner(number, season_id)')
    .eq('f1_rounds.season_id', round.season_id)
    .in('type', ['R', 'SR'])
    .lte('f1_rounds.number', round.number);

  if (sessionsError) throw new Error(`Failed to load race sessions: ${sessionsError.message}`);
  if (!raceSessions || raceSessions.length === 0) return;

  const sessionIds = raceSessions.map((s: Record<string, unknown>) => s.id as number);
  const sessionTypeById = new Map<number, string>(
    raceSessions.map((s: Record<string, unknown>) => [s.id as number, s.type as string])
  );

  // Get all race/sprint session entries for these sessions
  const { data: entries, error: entriesError } = await client
    .from('f1_session_entries')
    .select(
      'points, position, session_id, round_entry_id!inner(team_driver_id!inner(driver_id, team_id))'
    )
    .in('session_id', sessionIds);

  if (entriesError) throw new Error(`Failed to load race entries: ${entriesError.message}`);
  if (!entries || entries.length === 0) return;

  // Aggregate stats per driver and per team. Points count from both race (R) and sprint (SR).
  // Wins/highest-finish count only from full Grands Prix (R) to match existing data conventions.
  const driverStats = new Map<number, { points: number; wins: number; highest: number }>();
  const teamStats = new Map<number, { points: number; wins: number; highest: number }>();

  for (const entry of entries) {
    const td = entry.round_entry_id.team_driver_id;
    const driverId = td.driver_id;
    const teamId = td.team_id;
    const points = entry.points || 0;
    const position = entry.position ?? null;
    const sessionType = sessionTypeById.get(entry.session_id) || 'R';

    if (!driverStats.has(driverId)) {
      driverStats.set(driverId, { points: 0, wins: 0, highest: Infinity });
    }
    const ds = driverStats.get(driverId)!;
    ds.points += points;
    if (sessionType === 'R') {
      if (position === 1) ds.wins += 1;
      if (position !== null && position < ds.highest) ds.highest = position;
    }

    if (teamId) {
      if (!teamStats.has(teamId)) {
        teamStats.set(teamId, { points: 0, wins: 0, highest: Infinity });
      }
      const ts = teamStats.get(teamId)!;
      ts.points += points;
      if (sessionType === 'R') {
        if (position === 1) ts.wins += 1;
        if (position !== null && position < ts.highest) ts.highest = position;
      }
    }
  }

  await upsertDriverChampionships(client, round, season, raceSessionId, driverStats);
  await upsertTeamChampionships(client, round, season, raceSessionId, teamStats);
}

async function upsertDriverChampionships(
  client: DBClient,
  round: RoundData,
  season: number,
  raceSessionId: number,
  driverStats: Map<number, { points: number; wins: number; highest: number }>
): Promise<void> {
  const { data: existing, error: existingError } = await client
    .from('f1_driver_championships')
    .select('id, driver_id')
    .eq('round_id', round.id);

  if (existingError)
    throw new Error(`Failed to load existing driver championships: ${existingError.message}`);

  const existingMap = new Map(
    (existing || []).map((e: Record<string, unknown>) => [e.driver_id, e.id])
  );

  const ranked = Array.from(driverStats.entries())
    .map(([driverId, stats]) => ({ driverId, ...stats }))
    .sort((a, b) => b.points - a.points);

  let position = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i].points !== ranked[i - 1].points) {
      position = i + 1;
    }
    ranked[i].position = position;
  }

  let nextId = await getNextId(client, 'f1_driver_championships');
  const rows: Record<string, unknown>[] = [];

  for (const r of ranked) {
    const row: Record<string, unknown> = {
      driver_id: r.driverId,
      season_id: round.season_id,
      round_id: round.id,
      round_number: round.number,
      session_id: raceSessionId,
      session_number: round.number,
      year: season,
      position: r.position,
      points: r.points,
      win_count: r.wins,
      highest_finish: r.highest === Infinity ? null : r.highest,
      is_eligible: true,
    };

    if (existingMap.has(r.driverId)) {
      row.id = existingMap.get(r.driverId);
    } else {
      row.id = nextId++;
    }

    rows.push(row);
  }

  if (rows.length > 0) {
    const { error } = await client
      .from('f1_driver_championships')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Failed to upsert driver championships: ${error.message}`);
  }
}

async function upsertTeamChampionships(
  client: DBClient,
  round: RoundData,
  season: number,
  raceSessionId: number,
  teamStats: Map<number, { points: number; wins: number; highest: number }>
): Promise<void> {
  const { data: existing, error: existingError } = await client
    .from('f1_team_championships')
    .select('id, team_id')
    .eq('round_id', round.id);

  if (existingError)
    throw new Error(`Failed to load existing team championships: ${existingError.message}`);

  const existingMap = new Map(
    (existing || []).map((e: Record<string, unknown>) => [e.team_id, e.id])
  );

  const ranked = Array.from(teamStats.entries())
    .map(([teamId, stats]) => ({ teamId, ...stats }))
    .sort((a, b) => b.points - a.points);

  let position = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i].points !== ranked[i - 1].points) {
      position = i + 1;
    }
    ranked[i].position = position;
  }

  let nextId = await getNextId(client, 'f1_team_championships');
  const rows: Record<string, unknown>[] = [];

  for (const r of ranked) {
    const row: Record<string, unknown> = {
      team_id: r.teamId,
      season_id: round.season_id,
      round_id: round.id,
      round_number: round.number,
      session_id: raceSessionId,
      session_number: round.number,
      year: season,
      position: r.position,
      points: r.points,
      win_count: r.wins,
      highest_finish: r.highest === Infinity ? null : r.highest,
      is_eligible: true,
    };

    if (existingMap.has(r.teamId)) {
      row.id = existingMap.get(r.teamId);
    } else {
      row.id = nextId++;
    }

    rows.push(row);
  }

  if (rows.length > 0) {
    const { error } = await client.from('f1_team_championships').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Failed to upsert team championships: ${error.message}`);
  }
}
