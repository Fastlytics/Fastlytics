import { Navigate, useParams } from 'react-router-dom';

/**
 * Backward-compat redirect: `/race/:raceId/team-pace` → `/team-pace?race=<raceId>`.
 * Team Pace analysis lives on the global `/team-pace` page now.
 */
export default function TeamPaceRedirect() {
  const { raceId } = useParams<{ raceId: string }>();
  return <Navigate to={`/team-pace?race=${raceId ?? ''}`} replace />;
}
