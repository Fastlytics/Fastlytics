-- Compute driver teammate head-to-head stats (qualifying, race, points) directly in Postgres.
-- Replaces the previous Python implementation that read FastF1 gzipped cache files one-by-one.
CREATE OR REPLACE FUNCTION get_driver_teammate_battle(p_driver_id integer)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  driver_record record;
  result jsonb;
BEGIN
  SELECT id, reference, abbreviation, forename, surname, image_url
  INTO driver_record
  FROM f1_drivers
  WHERE id = p_driver_id;

  IF driver_record IS NULL THEN
    RETURN jsonb_build_object(
      'driver', jsonb_build_object('slug', '', 'code', '', 'name', '', 'headshotUrl', ''),
      'battles', '[]'::jsonb
    );
  END IF;

  WITH
  driver_stints AS (
    SELECT td.id AS team_driver_id, td.team_id, td.season_id, s.year, t.name AS team_name, t.primary_color
    FROM f1_team_drivers td
    JOIN f1_seasons s ON s.id = td.season_id
    JOIN f1_teams t ON t.id = td.team_id
    WHERE td.driver_id = driver_record.id
  ),
  teammate_stints AS (
    SELECT
      ds.team_driver_id AS driver_team_driver_id,
      ds.season_id,
      ds.year,
      ds.team_name,
      ds.primary_color,
      td2.id AS teammate_team_driver_id,
      td2.driver_id AS teammate_driver_id,
      d2.reference AS teammate_ref,
      d2.abbreviation AS teammate_code,
      d2.forename || ' ' || d2.surname AS teammate_name,
      d2.image_url AS teammate_image_url
    FROM driver_stints ds
    JOIN f1_team_drivers td2 ON td2.team_id = ds.team_id AND td2.season_id = ds.season_id AND td2.driver_id != driver_record.id
    JOIN f1_drivers d2 ON d2.id = td2.driver_id
  ),
  race_matchups AS (
    SELECT
      ts.teammate_driver_id,
      ts.teammate_ref,
      ts.teammate_code,
      ts.teammate_name,
      ts.teammate_image_url,
      ts.year,
      ts.team_name,
      ts.primary_color,
      r.id AS round_id,
      se_r_driver.position AS driver_race_pos,
      COALESCE(se_r_driver.points, 0) AS driver_points,
      se_r_teammate.position AS teammate_race_pos,
      COALESCE(se_r_teammate.points, 0) AS teammate_points,
      (
        SELECT MIN(se.position)
        FROM f1_sessions s
        JOIN f1_session_entries se ON se.session_id = s.id
        WHERE s.round_id = r.id
          AND s.type IN ('Q1', 'Q2', 'Q3')
          AND se.round_entry_id = re_driver.id
          AND se.position IS NOT NULL
      ) AS driver_quali_pos,
      (
        SELECT MIN(se.position)
        FROM f1_sessions s
        JOIN f1_session_entries se ON se.session_id = s.id
        WHERE s.round_id = r.id
          AND s.type IN ('Q1', 'Q2', 'Q3')
          AND se.round_entry_id = re_teammate.id
          AND se.position IS NOT NULL
      ) AS teammate_quali_pos
    FROM teammate_stints ts
    JOIN f1_rounds r ON r.season_id = ts.season_id
    JOIN f1_round_entries re_driver ON re_driver.round_id = r.id AND re_driver.team_driver_id = ts.driver_team_driver_id
    JOIN f1_round_entries re_teammate ON re_teammate.round_id = r.id AND re_teammate.team_driver_id = ts.teammate_team_driver_id
    LEFT JOIN f1_sessions s_r ON s_r.round_id = r.id AND s_r.type = 'R'
    LEFT JOIN f1_session_entries se_r_driver ON se_r_driver.session_id = s_r.id AND se_r_driver.round_entry_id = re_driver.id
    LEFT JOIN f1_session_entries se_r_teammate ON se_r_teammate.session_id = s_r.id AND se_r_teammate.round_entry_id = re_teammate.id
    WHERE se_r_driver.id IS NOT NULL AND se_r_teammate.id IS NOT NULL
  ),
  per_season AS (
    SELECT
      teammate_ref,
      teammate_code,
      teammate_name,
      teammate_image_url,
      teammate_driver_id,
      year,
      team_name,
      primary_color,
      COUNT(*) AS races,
      SUM(CASE WHEN driver_quali_pos IS NOT NULL AND teammate_quali_pos IS NOT NULL AND driver_quali_pos < teammate_quali_pos THEN 1 ELSE 0 END) AS quali_wins,
      SUM(CASE WHEN driver_quali_pos IS NOT NULL AND teammate_quali_pos IS NOT NULL AND teammate_quali_pos < driver_quali_pos THEN 1 ELSE 0 END) AS quali_losses,
      SUM(CASE WHEN driver_race_pos IS NOT NULL AND teammate_race_pos IS NOT NULL AND driver_race_pos < teammate_race_pos THEN 1 ELSE 0 END) AS race_wins,
      SUM(CASE WHEN driver_race_pos IS NOT NULL AND teammate_race_pos IS NOT NULL AND teammate_race_pos < driver_race_pos THEN 1 ELSE 0 END) AS race_losses,
      SUM(driver_points) AS driver_points,
      SUM(teammate_points) AS teammate_points
    FROM race_matchups
    GROUP BY teammate_ref, teammate_code, teammate_name, teammate_image_url, teammate_driver_id, year, team_name, primary_color
  ),
  championships AS (
    SELECT
      ps.teammate_ref,
      ps.year,
      dc_driver.position AS driver_champ_pos,
      dc_teammate.position AS teammate_champ_pos
    FROM per_season ps
    JOIN f1_seasons s ON s.year = ps.year
    LEFT JOIN f1_driver_championships dc_driver ON dc_driver.driver_id = driver_record.id AND dc_driver.season_id = s.id
    LEFT JOIN f1_driver_championships dc_teammate ON dc_teammate.driver_id = ps.teammate_driver_id AND dc_teammate.season_id = s.id
  ),
  latest_team AS (
    SELECT DISTINCT ON (teammate_ref)
      teammate_ref,
      team_name,
      primary_color
    FROM per_season
    ORDER BY teammate_ref, year DESC
  ),
  battles AS (
    SELECT
      ps.teammate_ref,
      ps.teammate_code,
      ps.teammate_name,
      ps.teammate_image_url,
      lt.team_name,
      lt.primary_color,
      SUM(ps.races) AS total_races,
      ARRAY_AGG(ps.year ORDER BY ps.year) AS seasons,
      SUM(ps.quali_wins) AS quali_wins,
      SUM(ps.quali_losses) AS quali_losses,
      SUM(ps.race_wins) AS race_wins,
      SUM(ps.race_losses) AS race_losses,
      SUM(ps.driver_points) AS driver_points,
      SUM(ps.teammate_points) AS teammate_points,
      COALESCE(SUM(CASE WHEN ch.driver_champ_pos IS NOT NULL AND ch.teammate_champ_pos IS NOT NULL AND ch.driver_champ_pos < ch.teammate_champ_pos THEN 1 ELSE 0 END), 0) AS champ_wins,
      COALESCE(SUM(CASE WHEN ch.driver_champ_pos IS NOT NULL AND ch.teammate_champ_pos IS NOT NULL AND ch.teammate_champ_pos < ch.driver_champ_pos THEN 1 ELSE 0 END), 0) AS champ_losses,
      jsonb_agg(
        jsonb_build_object(
          'year', ps.year,
          'team', ps.team_name,
          'teamColor', COALESCE(ps.primary_color, '#718096'),
          'races', ps.races,
          'qualiH2h', jsonb_build_object('driver', ps.quali_wins, 'teammate', ps.quali_losses),
          'raceH2h', jsonb_build_object('driver', ps.race_wins, 'teammate', ps.race_losses),
          'points', jsonb_build_object('driver', ps.driver_points, 'teammate', ps.teammate_points)
        )
        ORDER BY ps.year
      ) AS per_season
    FROM per_season ps
    LEFT JOIN championships ch ON ch.teammate_ref = ps.teammate_ref AND ch.year = ps.year
    LEFT JOIN latest_team lt ON lt.teammate_ref = ps.teammate_ref
    GROUP BY ps.teammate_ref, ps.teammate_code, ps.teammate_name, ps.teammate_image_url, lt.team_name, lt.primary_color
  )
  SELECT jsonb_build_object(
    'driver', jsonb_build_object(
      'slug', driver_record.reference,
      'code', driver_record.abbreviation,
      'name', driver_record.forename || ' ' || driver_record.surname,
      'headshotUrl', driver_record.image_url
    ),
    'battles', COALESCE(jsonb_agg(
      jsonb_build_object(
        'teammate', jsonb_build_object(
          'slug', teammate_ref,
          'code', teammate_code,
          'name', teammate_name,
          'headshotUrl', teammate_image_url
        ),
        'team', team_name,
        'teamColor', COALESCE(primary_color, '#718096'),
        'racesTogether', total_races,
        'seasons', seasons,
        'qualiH2h', jsonb_build_object('driver', quali_wins, 'teammate', quali_losses),
        'raceH2h', jsonb_build_object('driver', race_wins, 'teammate', race_losses),
        'points', jsonb_build_object('driver', driver_points, 'teammate', teammate_points),
        'championshipPositionsWon', jsonb_build_object('driver', champ_wins, 'teammate', champ_losses),
        'perSeason', per_season
      )
      ORDER BY (seasons)[array_length(seasons, 1)] DESC
    ), '[]'::jsonb)
  ) INTO result
  FROM battles;

  RETURN result;
END;
$$;
